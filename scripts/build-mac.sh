#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Expo SDK 57's supported minimum is Xcode 26.4. Swift 6.2 alone is not enough.
xcode_version="$(xcodebuild -version | sed -n 's/^Xcode //p')"
if ! python3 -c 'import sys; sys.exit(tuple(map(int, sys.argv[1].split("."))) < (26, 4))' "$xcode_version"; then
  echo "Expo SDK 57 requires Xcode 26.4 or newer. Active Xcode: $xcode_version. Update macOS/Xcode before building." >&2
  exit 1
fi
if [[ ! -f ios/Podfile ]]; then npm run prebuild:apple; fi
# Always reconcile native source lists, while preserving the locked versions.
(cd ios && pod install)
xcodebuild -workspace ios/SerienLogDev.xcworkspace -scheme SerienLogDev \
  -configuration Release -destination "platform=macOS,variant=Mac Catalyst,arch=$(uname -m)" \
  -derivedDataPath build/mac CODE_SIGN_IDENTITY=- \
  CODE_SIGNING_ALLOWED=YES CODE_SIGNING_REQUIRED=YES CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM= PROVISIONING_PROFILE_SPECIFIER= build
