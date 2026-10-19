#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export ANDROID_HOME="${ANDROID_HOME:-$HOME/.local/android-sdk}"
if [ -z "${JAVA_HOME:-}" ] && [ -x "$HOME/.local/jdk-21/bin/javac" ]; then
  export JAVA_HOME="$HOME/.local/jdk-21"
fi
for source_set in store devRelease; do
  cmp plugins/offline-AndroidManifest.xml "android/app/src/$source_set/AndroidManifest.xml"
done
# Merge manifests only. Do not assemble or sign any Store artifact.
android/gradlew -p android :app:processStoreReleaseMainManifest \
  :app:processDevReleaseMainManifest :app:processDevDebugMainManifest \
  --init-script "$PWD/scripts/manifest-only.gradle" --max-workers=4
python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET

name = '{http://schemas.android.com/apk/res/android}name'
blocked = {'android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'}
for variant in ['storeRelease', 'devRelease', 'devDebug']:
    task = 'process' + variant[0].upper() + variant[1:] + 'MainManifest'
    path = Path('android/app/build/intermediates/merged_manifest') / variant / task / 'AndroidManifest.xml'
    manifest = ET.parse(path).getroot()
    permissions = {element.get(name) for element in manifest if element.tag.startswith('uses-permission')}
    if variant == 'devDebug':
        if 'android.permission.INTERNET' not in permissions:
            raise SystemExit('Dev-Debug benötigt INTERNET für Metro.')
    elif permissions & blocked:
        raise SystemExit(f'{variant}: unerlaubte Netzwerkrechte {sorted(permissions & blocked)}')
    print(f'{variant}: Netzwerkrechte korrekt.')
PY
