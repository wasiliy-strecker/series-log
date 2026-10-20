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
cmp plugins/data-extraction-rules.xml android/app/src/main/res/xml/serienlog_data_extraction_rules.xml
# Merge manifests only. Do not assemble or sign any Store artifact.
android/gradlew -p android :app:processStoreReleaseMainManifest \
  :app:processDevReleaseMainManifest :app:processDevDebugMainManifest \
  --init-script "$PWD/scripts/manifest-only.gradle" --max-workers=4 "$@"
python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET

name = '{http://schemas.android.com/apk/res/android}name'
android = '{http://schemas.android.com/apk/res/android}'
blocked = {'android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'}
domains = {'root', 'file', 'database', 'sharedpref', 'external',
           'device_root', 'device_file', 'device_database', 'device_sharedpref'}
rules = ET.parse('android/app/src/main/res/xml/serienlog_data_extraction_rules.xml').getroot()
for mode in ['cloud-backup', 'device-transfer']:
    section = rules.find(mode)
    if section is None or section.findall('include'):
        raise SystemExit(f'{mode}: unerwartete Backup-Freigabe.')
    exclusions = {element.get('domain') for element in section.findall('exclude') if element.get('path') == '.'}
    if exclusions != domains:
        raise SystemExit(f'{mode}: unvollständige Backup-Ausschlüsse.')
for variant in ['storeRelease', 'devRelease', 'devDebug']:
    task = 'process' + variant[0].upper() + variant[1:] + 'MainManifest'
    path = Path('android/app/build/intermediates/merged_manifest') / variant / task / 'AndroidManifest.xml'
    manifest = ET.parse(path).getroot()
    permissions = {element.get(name) for element in manifest if element.tag.startswith('uses-permission')}
    app = manifest.find('application')
    if app is None or app.get(android + 'allowBackup') != 'false' or app.get(android + 'fullBackupContent') != 'false':
        raise SystemExit(f'{variant}: ältere Android-Backups nicht deaktiviert.')
    if app.get(android + 'dataExtractionRules') != '@xml/serienlog_data_extraction_rules':
        raise SystemExit(f'{variant}: moderne Backup-Ausschlüsse fehlen.')
    if variant == 'devDebug':
        if 'android.permission.INTERNET' not in permissions:
            raise SystemExit('Dev-Debug benötigt INTERNET für Metro.')
    elif permissions & blocked:
        raise SystemExit(f'{variant}: unerlaubte Netzwerkrechte {sorted(permissions & blocked)}')
    print(f'{variant}: Netzwerkrechte und Backup-Ausschlüsse korrekt.')
PY
