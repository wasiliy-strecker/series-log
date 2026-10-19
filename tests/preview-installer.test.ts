import { afterEach, expect, it } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const temporary: string[] = [];
afterEach(() => {
  temporary
    .splice(0)
    .forEach((path) => rmSync(path, { recursive: true, force: true }));
});
function install(mode: 'preview' | 'debug', permissions: string) {
  const sdk = mkdtempSync(join(tmpdir(), 'serienlog-installer-'));
  temporary.push(sdk);
  mkdirSync(join(sdk, 'build-tools/36.0.0'), { recursive: true });
  mkdirSync(join(sdk, 'platform-tools'));
  writeFileSync(
    join(sdk, 'build-tools/36.0.0/aapt'),
    '#!/bin/bash\nprintf "%s\\n" "$SERIES_TEST_BADGING"\n',
    { mode: 0o700 },
  );
  writeFileSync(
    join(sdk, 'platform-tools/adb'),
    '#!/bin/bash\ntouch "$SERIES_TEST_CONTACT"\nexit 77\n',
    { mode: 0o700 },
  );
  const contact = join(sdk, 'adb-contacted');
  const result = spawnSync(
    'bash',
    ['scripts/install-android.sh', mode, 'synthetic-device', 'synthetic.apk'],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        ANDROID_HOME: sdk,
        SERIES_TEST_CONTACT: contact,
        SERIES_TEST_BADGING:
          "package: name='com.appfactory.series_log.dev' versionCode='1' versionName='1.0.0'\n" +
          permissions,
      },
    },
  );
  return { result, contacted: existsSync(contact) };
}

it.each([
  "uses-permission: name='android.permission.INTERNET'",
  "uses-permission: name='android.permission.ACCESS_NETWORK_STATE'",
  "uses-permission-sdk-23: name='android.permission.INTERNET'",
])(
  'rejects preview network permissions before contacting a device: %s',
  (permission) => {
    const { result, contacted } = install('preview', permission);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('keine Netzwerkberechtigungen');
    expect(contacted).toBe(false);
  },
);

it('allows Metro permissions in Dev-Debug and proceeds to the device check', () => {
  const { result, contacted } = install(
    'debug',
    "application-debuggable\nuses-permission: name='android.permission.INTERNET'",
  );
  expect(result.status).toBe(77);
  expect(contacted).toBe(true);
});
