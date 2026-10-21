#!/usr/bin/env bash
# Dedicated, empty screenshot AVD. No user device or existing AVD is modified.
set -euo pipefail
cd "$(dirname "$0")/../.."
profile=${1:?Usage: prepare_emulator.sh phone|tablet7|tablet10}
case "$profile" in
  phone) width=1080; height=1920; density=360; device=pixel_6 ;;
  tablet7) width=1080; height=1920; density=240; device='Nexus 7 2013' ;;
  tablet10) width=1440; height=2560; density=240; device='Nexus 10' ;;
  *) echo 'Unknown profile' >&2; exit 2 ;;
esac
sdk=${SL_ANDROID_SDK:-$HOME/.local/android-sdk}
adb="$sdk/platform-tools/adb"
port=${SL_EMULATOR_PORT:-5588}
[[ "$port" =~ ^[0-9]+$ ]] && (( port >= 5554 && port <= 5682 && port % 2 == 0 ))
serial="emulator-$port"
if "$adb" devices | awk '{print $1}' | rg -qx "$serial"; then
  echo 'Selected emulator port is already in use.' >&2
  exit 1
fi
work=$(mktemp -d /dev/shm/sl-store-assets-XXXXXX)
name="sl_store_assets_${profile}_$(date +%s)"
export ANDROID_AVD_HOME="$work/avd"
export ANDROID_SDK_ROOT="$sdk"
mkdir -p "$ANDROID_AVD_HOME" build/store-assets/raw
printf 'no\n' | "$sdk/cmdline-tools/latest/bin/avdmanager" create avd --name "$name" \
  --package 'system-images;android-35;google_apis;x86_64' \
  --path "$ANDROID_AVD_HOME/$name.avd" --device "$device"
python3 - "$ANDROID_AVD_HOME/$name.avd/config.ini" "$width" "$height" "$density" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
config = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)
config.update({'hw.lcd.width': sys.argv[2], 'hw.lcd.height': sys.argv[3],
               'hw.lcd.density': sys.argv[4], 'hw.initialOrientation': 'Portrait',
               'hw.keyboard': 'yes', 'hw.mainKeys': 'no', 'hw.ramSize': '2048',
               'vm.heapSize': '512', 'showDeviceFrame': 'no', 'disk.dataPartition.size': '2G'})
path.write_text(''.join(f'{k}={v}\n' for k, v in config.items()))
PY
cp "$ANDROID_AVD_HOME/$name.avd/config.ini" "build/store-assets/raw/$profile-avd.ini"
printf '%s\n' "$work" > "build/store-assets/raw/$profile-workspace.txt"
"$sdk/emulator/emulator" -avd "$name" -port "$port" -no-window -no-audio \
  -no-snapshot -no-boot-anim -gpu swiftshader -memory 2048 -cores 4 \
  -camera-back none -camera-front none -prop persist.sys.locale=de-DE \
  > "$work/emulator.log" 2>&1 &
emulator_pid=$!
for attempt in $(seq 1 120); do
  if [[ $("$adb" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r') == 1 ]]; then break; fi
  sleep 1
done
[[ $("$adb" -s "$serial" shell getprop ro.kernel.qemu | tr -d '\r') == 1 ]]
[[ $("$adb" -s "$serial" emu avd name | head -n1 | tr -d '\r') == "$name" ]]
[[ -z $("$adb" -s "$serial" shell pm list packages com.appfactory.series_log) ]]
"$adb" -s "$serial" shell cmd uimode night yes
"$adb" -s "$serial" shell cmd alarm set-timezone Europe/Berlin
"$adb" -s "$serial" shell settings put system accelerometer_rotation 0
"$adb" -s "$serial" shell settings put system user_rotation 0
"$adb" -s "$serial" shell settings put system font_scale 1.0
for setting in window_animation_scale transition_animation_scale animator_duration_scale; do
  "$adb" -s "$serial" shell settings put global "$setting" 0
done
printf 'Ready: %s, %s, workspace %s\n' "$profile" "$serial" "$work"
wait "$emulator_pid"
