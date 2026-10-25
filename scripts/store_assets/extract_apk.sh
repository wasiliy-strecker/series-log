#!/usr/bin/env bash
# Create a local emulator package from the verified AAB. Never signs the upload AAB.
set -euo pipefail
cd "$(dirname "$0")/../.."
aab=$(realpath "${1:?Explicit AAB required}")
out=$(realpath -m "${2:?Output directory required}")
bundletool=${BUNDLETOOL_JAR:-$HOME/.local/share/app-factory/tools/bundletool-all-1.18.3.jar}
mkdir -p "$out/raw"
if [[ -e "$out/raw/store.apk" || -e "$out/raw/store.apks" ]]; then
  echo 'Emulator artifact already exists. Use a new output directory.' >&2
  exit 1
fi
java -jar "$bundletool" build-apks --bundle="$aab" --output="$out/raw/store.apks" --mode=universal
unzip -p "$out/raw/store.apks" universal.apk > "$out/raw/store.apk"
java -jar "$bundletool" dump manifest --bundle="$aab" --module=base > "$out/raw/source-manifest.xml"
python3 - "$aab" "$out/raw/store.apk" <<'PY'
from pathlib import Path
import sys
sys.path.insert(0,'scripts/store_assets')
from package import verify_source
print('Verified matching AAB code, assets and libraries:',verify_source(Path(sys.argv[1]),Path(sys.argv[2])))
PY
