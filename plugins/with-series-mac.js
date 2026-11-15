const {
  withXcodeProject,
  withPodfile,
  withPodfileProperties,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const plist = require('@expo/plist');

function configureBuildSettings(settings, configuration, projectName) {
  settings.SUPPORTS_MACCATALYST = 'YES';
  settings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'NO';
  settings['"PRODUCT_NAME[sdk=macosx*]"'] = 'SeriesLog';
  settings.DERIVE_MACCATALYST_PRODUCT_BUNDLE_IDENTIFIER = 'NO';
  settings['"PRODUCT_BUNDLE_IDENTIFIER[sdk=macosx*]"'] =
    'de.appfabrik.serieslog';
  settings['"MACOSX_DEPLOYMENT_TARGET[sdk=macosx*]"'] = '13.3';
  settings['"ENABLE_HARDENED_RUNTIME[sdk=macosx*]"'] = 'YES';
  settings['"CODE_SIGN_ENTITLEMENTS[sdk=macosx*]"'] =
    `${projectName}/SeriesLogMac${configuration === 'Debug' ? '.Debug' : ''}.entitlements`;
  return settings;
}

function entitlements(debug = false) {
  return {
    'com.apple.security.app-sandbox': true,
    'com.apple.security.files.user-selected.read-write': true,
    'com.apple.security.print': true,
    ...(debug ? { 'com.apple.security.network.client': true } : {}),
  };
}

function configurePodfile(contents) {
  // RN already has Catalyst slices. Expo's prebuilt modules do not, so build
  // Expo from source instead of linking iPhone binaries into the Mac target.
  const pattern = /:mac_catalyst_enabled\s*=>\s*(?:false|true)/;
  if (!pattern.test(contents))
    throw new Error(
      'Cannot find React Native Mac Catalyst post-install setting',
    );
  return contents.replace(pattern, ':mac_catalyst_enabled => true');
}

module.exports = function withSeriesMac(config) {
  config = withPodfileProperties(config, (result) => {
    result.modResults.EXPO_USE_PRECOMPILED_MODULES = 'false';
    result.modResults['ios.deploymentTarget'] = '16.4';
    return result;
  });
  config = withPodfile(config, (result) => {
    result.modResults.contents = configurePodfile(result.modResults.contents);
    return result;
  });
  config = withXcodeProject(config, (result) => {
    const configurations = result.modResults.pbxXCBuildConfigurationSection();
    for (const entry of Object.values(configurations)) {
      if (
        typeof entry !== 'object' ||
        !entry.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER
      )
        continue;
      configureBuildSettings(
        entry.buildSettings,
        entry.name,
        result.modRequest.projectName,
      );
    }
    return result;
  });
  return withDangerousMod(config, [
    'ios',
    async (result) => {
      const directory = path.join(
        result.modRequest.platformProjectRoot,
        result.modRequest.projectName,
      );
      fs.mkdirSync(directory, { recursive: true });
      for (const debug of [false, true]) {
        fs.writeFileSync(
          path.join(
            directory,
            `SeriesLogMac${debug ? '.Debug' : ''}.entitlements`,
          ),
          plist.default.build(entitlements(debug)),
        );
      }
      return result;
    },
  ]);
};
module.exports.configureBuildSettings = configureBuildSettings;
module.exports.configurePodfile = configurePodfile;
module.exports.entitlements = entitlements;
