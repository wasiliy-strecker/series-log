#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
variant="${1:?Bitte devDebug oder devRelease angeben.}"
shift
case "$variant" in
  devDebug) task='assembleDevDebug' ;;
  devRelease) task='assembleDevRelease' ;;
  *) echo 'Nur SerienLog-Dev-Builds sind hier erlaubt.' >&2; exit 1 ;;
esac
export ANDROID_HOME="${ANDROID_HOME:-$HOME/.local/android-sdk}"
if [ -z "${JAVA_HOME:-}" ] && [ -x "$HOME/.local/jdk-21/bin/javac" ]; then
  export JAVA_HOME="$HOME/.local/jdk-21"
fi
bash scripts/prepare-dev-key.sh
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:"$task" -PreactNativeArchitectures=arm64-v8a,x86_64 --max-workers=4 "$@"
