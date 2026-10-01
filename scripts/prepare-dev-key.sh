#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .local/dev.keystore ]; then exit 0; fi
mkdir -p .local
if [ -z "${JAVA_HOME:-}" ] && [ -x "$HOME/.local/jdk-21/bin/keytool" ]; then
  export JAVA_HOME="$HOME/.local/jdk-21"
fi
keytool_bin="${JAVA_HOME:+$JAVA_HOME/bin/}keytool"
"$keytool_bin" -genkeypair -keystore .local/dev.keystore -storepass android -keypass android -alias androiddebugkey -dname 'CN=SerienLog Local Development' -keyalg RSA -keysize 2048 -validity 10000 -noprompt
