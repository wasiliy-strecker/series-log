#!/usr/bin/env bash
# Run an existing Store release only in a new disposable screenshot emulator.
set -euo pipefail
profile=${1:?Usage: prepare_emulator.sh phone|tablet7|tablet10 OUTPUT AAB LOCALE}
out=$(realpath -m "${2:?Output directory required}")
case "$profile" in
  phone) width=1080; height=1920; density=300; device=pixel_6 ;;
  tablet7) width=1200; height=1920; density=320; device=Nexus\ 7\ 2013 ;;
  tablet10) width=1600; height=2560; density=320; device=Nexus\ 10 ;;
  *) echo 'Unknown capture profile' >&2; exit 2 ;;
esac
sdk=${SL_ANDROID_SDK:-/home/unknown/.local/android-sdk}
adb="$sdk/platform-tools/adb"
locale=${4:?Locale required}
bundletool=${BUNDLETOOL_JAR:-$HOME/.local/share/app-factory/tools/bundletool-all-1.18.3.jar}
port=${SL_EMULATOR_PORT:-5586}
[[ "$port" =~ ^[0-9]+$ ]] && (( port >= 5554 && port <= 5682 && port % 2 == 0 ))
serial="emulator-$port"
if "$adb" devices | awk '{print $1}' | rg -qx "$serial"; then
  echo 'The selected emulator port is already in use.' >&2
  exit 1
fi
mkdir -p "$out/raw"
aab=$(realpath "${3:?Explicit AAB required}")
if [[ ! -f "$out/raw/store.apk" ]]; then
  java -jar "$bundletool" build-apks --bundle="$aab" --output="$out/raw/store.apks" --mode=universal
  unzip -p "$out/raw/store.apks" universal.apk > "$out/raw/store.apk"
fi
java -jar "$bundletool" dump manifest --bundle="$aab" --module=base > "$out/raw/source-manifest.xml"
work=$(mktemp -d /dev/shm/sl-store-assets-XXXXXX)
name="sl_store_assets_${profile}_$(date +%s)"
export ANDROID_AVD_HOME="$work/avd"
export ANDROID_SDK_ROOT="$sdk"
mkdir -p "$ANDROID_AVD_HOME"
printf 'no\n' | "$sdk/cmdline-tools/latest/bin/avdmanager" create avd --name "$name" \
  --package 'system-images;android-35;google_apis;x86_64' --path "$ANDROID_AVD_HOME/$name.avd" --device "$device"
python3 - "$ANDROID_AVD_HOME/$name.avd/config.ini" "$width" "$height" "$density" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
config = dict(line.split('=', 1) for line in path.read_text().splitlines() if '=' in line)
config.update({'hw.lcd.width': sys.argv[2], 'hw.lcd.height': sys.argv[3],
               'hw.lcd.density': sys.argv[4], 'hw.initialOrientation': 'Portrait',
               'hw.keyboard': 'yes', 'hw.mainKeys': 'no', 'hw.ramSize': '3072', 'vm.heapSize': '512',
               'showDeviceFrame': 'no', 'disk.dataPartition.size': '2G'})
path.write_text(''.join(f'{k}={v}\n' for k, v in config.items()))
PY
cp "$ANDROID_AVD_HOME/$name.avd/config.ini" "$out/raw/$profile-avd.ini"
printf '%s\n' "$work" > "$out/raw/$profile-workspace.txt"
"$sdk/emulator/emulator" -avd "$name" -port "$port" -no-window -no-audio \
  -no-snapshot -no-boot-anim -gpu swiftshader -memory 3072 -cores 4 \
  -camera-back none -camera-front none -prop "persist.sys.locale=$locale" \
  > "$work/emulator.log" 2>&1 &
emulator_pid=$!
for attempt in $(seq 1 120); do
  if [[ $("$adb" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r') == 1 ]]; then break; fi
  sleep 1
done
[[ $("$adb" -s "$serial" shell getprop ro.kernel.qemu | tr -d '\r') == 1 ]]
[[ $("$adb" -s "$serial" emu avd name | head -n1 | tr -d '\r') == "$name" ]]
# AVD first boot ignores persist.sys.locale passed as an emulator property.
# Configure the dedicated AVD's real system region before installing the app.
for attempt in $(seq 1 5); do
  if "$adb" -s "$serial" root; then break; fi
  sleep 2
done
"$adb" -s "$serial" wait-for-device
[[ $("$adb" -s "$serial" shell id -u | tr -d '\r') == 0 ]]
"$adb" -s "$serial" shell setprop persist.sys.locale "$locale"
"$adb" -s "$serial" shell stop
"$adb" -s "$serial" shell setprop sys.boot_completed 0
"$adb" -s "$serial" shell start
for attempt in $(seq 1 90); do
  if [[ $("$adb" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r') == 1 ]]; then break; fi
  sleep 1
done
"$adb" -s "$serial" shell cmd connectivity airplane-mode enable
"$adb" -s "$serial" shell am get-config > "$out/raw/$profile-system-config.txt"
[[ $("$adb" -s "$serial" shell getprop persist.sys.locale | tr -d '\r') == "$locale" ]]
[[ -z $("$adb" -s "$serial" shell pm list packages com.appfactory.series_log) ]]
"$sdk/build-tools/35.0.0/aapt" dump badging "$out/raw/store.apk" | sed -n '1,3p'
"$adb" -s "$serial" install -r -t --no-streaming "$out/raw/store.apk"
"$adb" -s "$serial" shell dumpsys package com.appfactory.series_log > "$out/raw/$profile-package.txt"
"$adb" -s "$serial" shell cmd uimode night yes
"$adb" -s "$serial" shell cmd alarm set-timezone Europe/Berlin
"$adb" -s "$serial" shell settings put system accelerometer_rotation 0
"$adb" -s "$serial" shell settings put system user_rotation 0
"$adb" -s "$serial" shell settings put system font_scale 1.0
for setting in window_animation_scale transition_animation_scale animator_duration_scale; do
  "$adb" -s "$serial" shell settings put global "$setting" 0
done
"$adb" -s "$serial" shell pm grant com.appfactory.series_log android.permission.POST_NOTIFICATIONS
"$adb" -s "$serial" shell am start -n com.appfactory.series_log/.MainActivity
sleep 4
printf 'Ready: %s, %s, workspace %s\n' "$profile" "$serial" "$work"
wait "$emulator_pid"
