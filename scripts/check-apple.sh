#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
swift test --package-path modules/series-native
mac_sdk_path="$(xcrun --sdk macosx --show-sdk-path)"
# Compile against the Mac Catalyst ABI, not against the iPhone simulator SDK.
xcrun swiftc -typecheck -parse-as-library -swift-version 5 \
  -target "$(uname -m)-apple-ios16.4-macabi" -sdk "$mac_sdk_path" \
  -F "$mac_sdk_path/System/iOSSupport/System/Library/Frameworks" \
  -I "$mac_sdk_path/System/iOSSupport/usr/include" \
  modules/series-native/ios/Core/*.swift \
  modules/series-native/ios/NativeLanguage.swift \
  modules/series-native/ios/PdfServices.swift \
  modules/series-native/ios/PhotoImport.swift \
  modules/series-native/ios/ReminderScheduler.swift
xcrun swiftc -frontend -parse modules/series-native/ios/SeriesNativeModule.swift \
  modules/series-native/ios/SeriesPdfView.swift
