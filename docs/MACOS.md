# SerienLog / Series Log for Mac

Status: Mac Catalyst implementation prepared locally. **There is no verified,
runnable Mac app yet.** This is a Mac Catalyst target with a Mac binary and Mac
App Store sandbox configuration, not the “Designed for iPad” distribution option.

## Identity and supported tools

- Proposed Apple bundle ID: `de.appfabrik.serieslog`
- Apple team: `XLR3785994`
- Version/build: `1.0.0` / `1`
- Mac product: `SeriesLog.app`
- Workspace/scheme: `ios/SerienLogDev.xcworkspace` / `SerienLogDev`
- Catalyst deployment target: iOS ABI 16.4 / macOS 13.3
- Languages: German, English, Spanish, French, Italian, Brazilian Portuguese

The bundle ID is a local preparation choice. Registration and app creation in
App Store Connect are still needed. Existing Android IDs and versions are unchanged.

Expo SDK 57 requires **Xcode 26.4 or newer**. Swift 6.2 is only the first failing
package requirement, not the complete toolchain requirement. For Xcode 27 builds,
Expo's UIKit scene lifecycle is enabled with `expo-build-properties`. Consult
[Expo's supported SDK/tool versions](https://docs.expo.dev/versions/latest/) and
[Apple's Xcode/macOS compatibility table](https://developer.apple.com/xcode/system-requirements).

## Implemented Mac behavior

- Native Mac photo file dialog. Camera actions are hidden on Catalyst. Selected
  files are copied into the sandbox, downsampled to at most 1920 pixels and encoded
  as fresh JPEGs without inherited location/capture metadata. Original files stay
  untouched. Temporary import copies are removed after import or failure.
- Resizable window with a 640×480 minimum, scrollable forms, mouse-accessible photo
  menus and alternative Earlier/Later ordering actions.
- PDFKit previews, bounded page rendering, validation, sharing and system printing.
- Native backup save dialog and file import. Existing `.slbackup` / `SLBACK01`
  files use the unchanged 600,000-round PBKDF2-SHA256 key and authenticated AES-GCM
  codec. Native key derivation is checked against the fixed legacy Android fixture.
- Local UserNotifications reminders and localized permission/status messages.
  Mac notifications do not pretend to provide Android exact alarms or channels.
- Six app languages, localized native permission descriptions and app titles.
- SQLite database `serienlog.db`, existing schema, record IDs and file formats
  remain compatible. There is no runtime dependency on a sibling app.

The notification settings action displays the manual System Settings → Notifications
→ Series Log path on Mac. There is no supported public URL to that specific app pane.
Photos, PDFs and backups stay local unless the user exports/shares them. The app's
Documents/Library container roots are excluded from automatic system backup.

## Reminder limits

Standard daily/weekly/monthly days 1–28/yearly days 1–28 and already-started hourly
reminders use repeating calendar triggers. Dates imported as the 29th–31st are
clamped to actual month ends. Those rules and future hourly starts use a bounded
schedule, with the final scheduled date shown in the series status.
Reopen the app before that date to extend the schedule. Standard recurring rules
continue without reopening the app.

The scheduler reserves at most 60 pending requests, gives each active series a
slot before extending bounded rules and reports any unconfirmed schedules.
Focus, Silent mode and system notification settings control actual presentation.
The test notification appears after two seconds and remains until dismissed.
A notification opens the app, without claiming a direct link to a specific series.

## Build configuration

`plugins/with-series-mac.js` persists the Catalyst settings through Apple prebuilds.
The Catalyst bundle ID is not automatically prefixed with `maccatalyst.`.
Release enables App Sandbox, user-selected read/write access and printing.
Debug additionally allows outgoing networking for Metro. Release has no network
entitlement and contains its JavaScript bundle.

React Native and React Native Dependencies include Catalyst framework slices.
The supplied Expo precompiled modules do not. The project therefore builds Expo
modules from source (`EXPO_USE_PRECOMPILED_MODULES=false`) and enables React Native's
Catalyst post-install adjustments. No dependency package sources are patched.

The native Apple module is `modules/series-native/ios/`. Source was adapted from
app-factory's local Machine Log implementation into independent Series Log files.
There is no OCR function in Series Log. App-specific notification text, identity,
`.slbackup` extension and legacy backup vectors belong to this app.

## Commands

Run from this app directory with Node 22, CocoaPods and the PDF test tools
`pdftotext`/`pdfimages` on PATH:

```sh
npm ci
npm run check
npm run prebuild:apple
npm run check:mac-config
npm run check:apple
npm run bundle:apple
npm run build:mac
```

`build:mac` checks Xcode first, reconciles Pods and creates a local, ad-hoc-signed
Release build. It is not an App Store archive or upload command. Once the build
succeeds, open:

```sh
open build/mac/Build/Products/Release-maccatalyst/SeriesLog.app
```

Apple prebuild uses `--no-clean --platform ios` and leaves Android generation alone.
Commit the Apple source project and Podfile.lock, not Pods, DerivedData, private
profiles or `.xcode.env.local`. Native source-list changes require `pod install`.
Regenerate the native message bundles with `python3 scripts/generate_localizations.py`.

## Verified on 5 November 2026

- `npm run check`: format, 534 messages across six languages, translation-call
  checks, ESLint, TypeScript and 94 tests passed (15 suites).
- `npm run check:apple`: eight Swift tests passed. PDF, photo, notification and
  other native services type-check against the **Mac Catalyst ABI**, using the
  installed macOS SDK. The Expo bridge declarations parse separately.
- `npm run check:mac-config`: three tests cover sandbox profiles, stable identity,
  regeneration hooks and the parsed Catalyst Xcode project.
- `npm run bundle:apple`: JavaScript/Hermes and assets exported successfully.
  Catalyst uses the React Native `ios` bundle with `Platform.isMacCatalyst` detection.
- CocoaPods resolved the module and native dependencies successfully.
- A real Release Mac Catalyst build was attempted. It selected the `maccatalyst`
  framework slice, then stopped in ExpoModulesJSI because Xcode 16.2 has Swift 6.0.3
  while the dependency package requires Swift tools 6.2. The app/Expo bridge has
  not linked and has not been launched.
- Android native and permission checks could not run because this Mac has no Java
  runtime. Shared JavaScript/domain/backup tests passed. No device was connected.

After the macOS/Xcode update, complete the Mac build and test cold start offline,
window resizing, keyboard/focus, all languages, file import/cancel, photo ordering,
PDF preview/print/share, Android backup restore and wrong-password rejection,
reminders while closed, denied notifications, and app restarts with saved data.
Store registration, signing/archive, Mac screenshots and Apple privacy publication
remain separate release work. There has been no Store API write or upload.

## Source verification update, 15 November 2026

The installed Apple and Android toolchains now allow the module checks to run.
Formatting, localization, ESLint, TypeScript, all 94 application tests, all eight
Swift core tests, Catalyst service type checking and all three configuration tests
passed. Android module compilation, all 59 unit tests and lint also passed.
The manifest-only permission check passed for Store Release, Dev Release and
Dev Debug, including network permissions and backup exclusions.

These checks cover the prepared source changes for the requested GitHub
synchronization. They do not verify a linked Mac application: the full Catalyst
build and the runtime checklist above remain required before an Apple release.
