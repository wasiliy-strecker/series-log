# Prepare Series Log for Mac Catalyst

- Added a separate local Apple project with proposed bundle ID `de.appfabrik.serieslog`, Mac Catalyst target, stable bundle identity, sandbox entitlements and a reproducible config plugin. Enabled Expo scene support and source builds for Expo modules; retained the existing Android identities.
- Added independent Apple services for PDFKit previews/rendering/printing/sharing, `.slbackup` export and compatible native PBKDF2 key derivation, localized notifications, private files and Mac photo imports. Preserved SQLite data and the existing authenticated backup format.
- Adapted photo actions, safe areas, reminder permissions/status and settings text for Apple. Added six-language Apple resources, native permission descriptions and manual Mac notification settings guidance. Kept Android-only alarm repair behind platform checks.
- Added build/check scripts, Mac instructions and focused platform/config/native tests. Corrected an existing test file-URI mock; formatted one existing changelog entry to satisfy the repository-wide formatter.

## Verification

- `npm run check`: format, localization (534 messages in six languages), ESLint, TypeScript and 94 tests in 15 suites passed.
- `npm run check:apple`: eight native Swift tests passed, including a fixed legacy backup vector, Unicode passwords, file containment and calendar rules. Native services type-check against Mac Catalyst; Expo bridge declarations parse separately.
- `npm run check:mac-config`: three configuration tests passed, including parsed regenerated Xcode settings, sandbox entitlements and idempotent prebuild hooks.
- `npm run prebuild:apple`, CocoaPods installation and `npm run bundle:apple` succeeded.
- Full Release Mac Catalyst build attempted; it selected the Catalyst framework slice but stopped at ExpoModulesJSI's Swift tools 6.2 requirement. Installed Xcode 16.2/Swift 6.0.3 cannot build Expo SDK 57, which requires Xcode 26.4+. No runnable Mac binary or linked Expo bridge has been verified.
- Android native/permission checks could not run because Java is unavailable. No device was connected. Mac runtime checks are listed in `docs/MACOS.md`.

## Remaining release work

Update macOS/Xcode, complete the full native build and runtime tests, then perform Store registration/signing, Mac screenshots and privacy publication. No Store API writes, uploads, signing credentials or pushes were made. Changes remain uncommitted because required full native verification is blocked, as required by the workspace rules. Sibling app implementations were read as references and were not modified by this task.
