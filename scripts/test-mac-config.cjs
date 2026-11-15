const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const xcode = require('xcode');
const {
  configureBuildSettings,
  configurePodfile,
  entitlements,
} = require('../plugins/with-series-mac');

test('Catalyst retains the chosen bundle identity and separate sandbox profiles', () => {
  const release = configureBuildSettings({}, 'Release', 'SerienLogDev');
  const debug = configureBuildSettings({}, 'Debug', 'SerienLogDev');
  assert.equal(release.SUPPORTS_MACCATALYST, 'YES');
  assert.equal(release['"PRODUCT_NAME[sdk=macosx*]"'], 'SeriesLog');
  assert.equal(release.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER, 'NO');
  assert.equal(
    release['"PRODUCT_BUNDLE_IDENTIFIER[sdk=macosx*]"'],
    'de.appfabrik.serieslog',
  );
  assert.match(
    debug['"CODE_SIGN_ENTITLEMENTS[sdk=macosx*]"'],
    /\.Debug\.entitlements$/,
  );
  assert.equal(entitlements()['com.apple.security.app-sandbox'], true);
  assert.equal(
    entitlements()['com.apple.security.files.user-selected.read-write'],
    true,
  );
  assert.equal(entitlements()['com.apple.security.print'], true);
  assert.equal(entitlements()['com.apple.security.network.client'], undefined);
  assert.equal(entitlements()['com.apple.security.device.camera'], undefined);
  assert.equal(entitlements(true)['com.apple.security.network.client'], true);
});

test('pod configuration is idempotent and fails loudly if its hook disappears', () => {
  const initial =
    'react_native_post_install(installer, :mac_catalyst_enabled => false)';
  const configured = configurePodfile(initial);
  assert.match(configured, /:mac_catalyst_enabled => true/);
  assert.equal(configurePodfile(configured), configured);
  assert.throws(() => configurePodfile('missing hook'));
});

test('generated Xcode project parses and has a real Mac Catalyst destination', () => {
  const root = path.join(__dirname, '..', 'ios');
  const project = xcode.project(
    path.join(root, 'SerienLogDev.xcodeproj', 'project.pbxproj'),
  );
  project.parseSync();
  const configurations = Object.values(
    project.pbxXCBuildConfigurationSection(),
  ).filter(
    (entry) =>
      typeof entry === 'object' &&
      entry.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER,
  );
  assert.equal(configurations.length, 2);
  for (const configuration of configurations) {
    assert.equal(configuration.buildSettings.SUPPORTS_MACCATALYST, 'YES');
    assert.equal(
      configuration.buildSettings.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER,
      'NO',
    );
  }
  const properties = JSON.parse(
    fs.readFileSync(path.join(root, 'Podfile.properties.json'), 'utf8'),
  );
  assert.equal(properties.EXPO_USE_PRECOMPILED_MODULES, 'false');
  assert.match(
    fs.readFileSync(path.join(root, 'Podfile'), 'utf8'),
    /:mac_catalyst_enabled => true/,
  );
});
