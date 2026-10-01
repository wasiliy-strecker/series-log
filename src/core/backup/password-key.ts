import { Platform } from 'react-native';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { seriesNative } from '../native/series-native';
import { noblePasswordKey, type PasswordKey } from './backup-service';
export const androidPasswordKey: PasswordKey = async (
  password,
  salt,
  iterations,
) => {
  if (Number(Platform.Version) < 26)
    return noblePasswordKey(password, salt, iterations);
  return hexToBytes(
    await seriesNative.deriveBackupKey(password, bytesToHex(salt), iterations),
  );
};
