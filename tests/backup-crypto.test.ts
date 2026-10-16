import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
} from 'node:crypto';
import { fixture, env, record } from './support';
import {
  BackupCodec,
  BackupService,
  type PasswordKey,
} from '../src/core/backup/backup-service';
import { expoBackupCrypto } from '../src/core/backup/expo-backup-crypto';
import { nobleBackupCrypto } from '../src/core/backup/backup-crypto';
import { snapshotFiles, type Snapshot } from '../src/core/domain/models';
import type { BackupProgress } from '../src/core/backup/backup-progress';

// Keep Expo's real JS wrappers. Replace only the Android/JSI boundary with
// independent OpenSSL primitives, including Android's synchronous digest API.
const native = await vi.hoisted(async () => {
  const { createCipheriv, createDecipheriv, createHash } =
    await import('node:crypto');
  const hash = vi.fn(
    (algorithm: string, output: Uint8Array, input: Uint8Array) => {
      if (algorithm !== 'SHA-256') throw new Error('Unexpected algorithm');
      output.set(createHash('sha256').update(input).digest());
    },
  );
  const importKey = vi.fn(async (bytes: Uint8Array) => ({
    bytes: bytes.slice(),
  }));
  const extract = vi.fn();
  class SealedData {
    constructor(
      readonly nonce: Uint8Array,
      readonly bytes: Uint8Array,
    ) {}
    static fromParts(nonce: Uint8Array, bytes: Uint8Array, tagLength: number) {
      if (tagLength !== 16) throw new Error('Unexpected tag length');
      return new SealedData(nonce, bytes);
    }
    async ciphertext(options: { includeTag: boolean; encoding: string }) {
      extract(options);
      if (!options.includeTag || options.encoding !== 'bytes')
        throw new Error('Unexpected ciphertext format');
      return this.bytes.slice();
    }
  }
  const encrypt = vi.fn(
    async (
      plaintext: Uint8Array,
      key: { bytes: Uint8Array },
      options: { nonce: string; additionalData: string; tagLength: number },
    ) => {
      if (!(plaintext instanceof Uint8Array) || options.tagLength !== 16)
        throw new Error('Expected binary plaintext and a 16-byte tag');
      const nonce = Buffer.from(options.nonce, 'base64');
      const cipher = createCipheriv('aes-256-gcm', key.bytes, nonce);
      cipher.setAAD(Buffer.from(options.additionalData, 'base64'));
      return new SealedData(
        nonce,
        new Uint8Array(
          Buffer.concat([
            cipher.update(plaintext),
            cipher.final(),
            cipher.getAuthTag(),
          ]),
        ),
      );
    },
  );
  const decrypt = vi.fn(
    async (
      sealed: SealedData,
      key: { bytes: Uint8Array },
      options: { additionalData: string; output: string },
    ) => {
      if (!(sealed.bytes instanceof Uint8Array) || options.output !== 'bytes')
        throw new Error('Expected binary ciphertext and output');
      const decipher = createDecipheriv('aes-256-gcm', key.bytes, sealed.nonce);
      decipher.setAAD(Buffer.from(options.additionalData, 'base64'));
      decipher.setAuthTag(sealed.bytes.subarray(-16));
      return new Uint8Array(
        Buffer.concat([
          decipher.update(sealed.bytes.subarray(0, -16)),
          decipher.final(),
        ]),
      );
    },
  );
  return {
    hash,
    importKey,
    extract,
    encrypt,
    decrypt,
    aes: {
      EncryptionKey: class {
        static import = importKey;
      },
      SealedData,
      encryptAsync: encrypt,
      decryptAsync: decrypt,
    },
  };
});
vi.mock('expo', () => ({ requireNativeModule: () => native.aes }));
vi.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ digest: native.hash }),
  UnavailabilityError: class extends Error {},
}));

const allAttachments = (entry: Snapshot['entries'][number]) =>
  entry.attachments;
const evidenceJson = (data: Snapshot) =>
  JSON.stringify(data, (key, value) => (key === 'file' ? undefined : value));
const password = 'Synthetic SerienLog ä🔑';
const passwordKey: PasswordKey = async (value, salt, iterations) =>
  new Uint8Array(pbkdf2Sync(value, salt, iterations, 32, 'sha256'));
const fixtures: Awaited<ReturnType<typeof fixture>>[] = [];
const nativeCodec = () => new BackupCodec(env, passwordKey, expoBackupCrypto);
const legacyBytes = async () =>
  new Uint8Array(
    await readFile(new URL('./fixtures/backup-v1.bin', import.meta.url)),
  );
const legacyData = async () =>
  JSON.parse(
    await readFile(
      new URL('./fixtures/backup-v1.json', import.meta.url),
      'utf8',
    ),
  ) as Snapshot;
async function setup() {
  const f = await fixture();
  fixtures.push(f);
  return f;
}
function open(bytes: Uint8Array) {
  const header = bytes.subarray(0, 40);
  const key = pbkdf2Sync(
    password,
    header.subarray(12, 28),
    new DataView(header.buffer, header.byteOffset).getUint32(8),
    32,
    'sha256',
  );
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    header.subarray(28, 40),
  );
  decipher.setAAD(header);
  decipher.setAuthTag(bytes.subarray(-16));
  const payload = Buffer.concat([
    decipher.update(bytes.subarray(40, -16)),
    decipher.final(),
  ]);
  const length = payload.readUInt32BE(0);
  const manifest = JSON.parse(
    payload.subarray(4, 4 + length).toString('utf8'),
  ) as {
    format: string;
    version: number;
    data: Snapshot;
    files: { file: string; sha256: string; size: number }[];
  };
  return { header, key, manifest, files: payload.subarray(4 + length) };
}
function reseal(
  original: Uint8Array,
  change: (manifest: ReturnType<typeof open>['manifest']) => void,
) {
  const { header, key, manifest, files } = open(original);
  change(manifest);
  const json = Buffer.from(JSON.stringify(manifest));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(json.length);
  const cipher = createCipheriv('aes-256-gcm', key, header.subarray(28, 40));
  cipher.setAAD(header);
  return new Uint8Array(
    Buffer.concat([
      header,
      cipher.update(Buffer.concat([length, json, files])),
      cipher.final(),
      cipher.getAuthTag(),
    ]),
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(async () => {
  vi.restoreAllMocks();
  for (const f of fixtures.splice(0)) await f.close();
});

it('reads the frozen pre-optimization backup through the real Expo wrappers and preserves its history and files', async () => {
  const progress: BackupProgress[] = [];
  const decoded = await nativeCodec().decode(
    await legacyBytes(),
    password,
    (p) => progress.push(p),
  );
  expect(decoded.data).toEqual(await legacyData());
  expect(decoded.files.size).toBe(3);
  expect(native.hash).toHaveBeenCalledTimes(3);
  expect(progress[0]).toEqual({ phase: 'decrypting' });
  expect(progress.at(-1)).toEqual({
    phase: 'checking',
    completedFiles: 3,
    totalFiles: 3,
  });
  const f = await setup();
  await new BackupService(f.series, nativeCodec()).restore(decoded);
  const restored = await f.repo.snapshot();
  expect(evidenceJson(restored)).toBe(evidenceJson(decoded.data));
  for (const attachment of restored.entries.flatMap(allAttachments))
    expect(
      createHash('sha256')
        .update(await f.vault.read(attachment.file))
        .digest('hex'),
    ).toBe(attachment.sha256);
});

it('reads and hashes each unique file once when creating a native backup, also retaining saved PDFs', async () => {
  const f = await setup();
  await f.backup.restore(
    await nativeCodec().decode(await legacyBytes(), password),
  );
  const data = await f.repo.snapshot();
  const entry = data.entries[0]!;
  const pdf = entry.attachments.find((a) => a.kind === 'pdf')!;
  await f.repo.saveReport({
    id: env.id(),
    recordId: entry.recordId,
    entryId: entry.id,
    file: pdf.file,
    sha256: pdf.sha256,
    name: 'Synthetic saved report',
    full: true,
    createdAt: env.now(),
  });
  const draftPhoto = await f.series.importAttachment(
    new Uint8Array(
      await readFile(new URL('./fixtures/photo.jpg', import.meta.url)),
    ),
    'photo',
    'Nur im Formularentwurf.jpg',
  );
  const pending = await f.series.draft(entry.recordId);
  pending.form.attachments = [draftPhoto];
  await f.series.persistDraft(pending);
  const drafts = await f.repo.drafts();
  const before = await f.repo.snapshot();
  const read = vi.spyOn(f.vault, 'read');
  vi.clearAllMocks();
  const progress: BackupProgress[] = [];
  const encoded = await new BackupService(f.series, nativeCodec()).create(
    password,
    (p) => progress.push(p),
  );
  expect(read).toHaveBeenCalledTimes(3);
  expect(native.hash).toHaveBeenCalledTimes(3);
  expect(native.encrypt).toHaveBeenCalledOnce();
  expect(progress[0]?.phase).toBe('preparing');
  expect(progress).toContainEqual({
    phase: 'checking',
    completedFiles: 3,
    totalFiles: 3,
  });
  expect(progress.at(-1)?.phase).toBe('encrypting');
  const independent = open(encoded);
  expect(new TextDecoder().decode(encoded.subarray(0, 8))).toBe('SLBACK01');
  expect(new DataView(encoded.buffer, encoded.byteOffset).getUint32(8)).toBe(
    600000,
  );
  expect(independent.manifest).toMatchObject({
    format: 'serienlog_backup',
    version: 1,
  });
  expect(independent.manifest.data).toEqual(before);
  let offset = 0;
  for (const file of independent.manifest.files) {
    expect(
      createHash('sha256')
        .update(independent.files.subarray(offset, offset + file.size))
        .digest('hex'),
    ).toBe(file.sha256);
    offset += file.size;
  }
  expect(offset).toBe(independent.files.length);
  const noble = new BackupCodec(env, passwordKey);
  expect((await noble.decode(encoded, password)).data).toEqual(before);
  const decoded = await nativeCodec().decode(encoded, password);
  expect(decoded.data).toEqual(before);
  expect(snapshotFiles(decoded.data)).toHaveLength(3);
  expect(decoded.files.has(draftPhoto.file)).toBe(false);
  await new BackupService(f.series, nativeCodec()).restore(decoded);
  expect(await f.repo.drafts()).toEqual(drafts);
  expect(await f.vault.list()).toContain(draftPhoto.file);
});

it('uses the exact byte slice for native hashes and AES without converting large payloads to strings', async () => {
  const storage = new Uint8Array(8 * 1024 * 1024 + 100).fill(7);
  const bytes = storage.subarray(31, -17);
  bytes.fill(42);
  expect(await expoBackupCrypto.hash(bytes)).toBe(
    createHash('sha256').update(bytes).digest('hex'),
  );
  expect(native.hash.mock.calls[0]![2].byteLength).toBe(bytes.byteLength);
  expect(native.hash.mock.calls[0]![2].byteOffset).toBe(31);
  const key = new Uint8Array(32).fill(8),
    nonce = new Uint8Array(12).fill(9),
    header = new Uint8Array(40).fill(10);
  const encrypted = await expoBackupCrypto.encrypt(key, nonce, header, bytes);
  expect(encrypted.length).toBe(bytes.length + 16);
  expect(native.encrypt.mock.calls[0]![0]).toBe(bytes);
  expect(native.extract).toHaveBeenCalledWith({
    includeTag: true,
    encoding: 'bytes',
  });
  const nobleClear = await nobleBackupCrypto.decrypt(
    key,
    nonce,
    header,
    encrypted,
  );
  const nativeClear = await expoBackupCrypto.decrypt(
    key,
    nonce,
    header,
    encrypted,
  );
  expect(Buffer.from(nobleClear).equals(Buffer.from(bytes))).toBe(true);
  expect(Buffer.from(nativeClear).equals(Buffer.from(bytes))).toBe(true);
});

it.each([
  'password',
  'header',
  'nonce',
  'tag',
  'truncated',
  'manifest hash',
  'foreign app',
  'foreign manifest',
  'unsupported KDF',
] as const)(
  'rejects %s tampering before any repository write',
  async (kind) => {
    let bytes = await legacyBytes();
    if (kind === 'header') bytes[12]! ^= 1;
    if (kind === 'nonce') bytes[28]! ^= 1;
    if (kind === 'tag') bytes[bytes.length - 1]! ^= 1;
    if (kind === 'truncated') bytes = bytes.slice(0, -1);
    if (kind === 'foreign app') bytes.set(new TextEncoder().encode('MLBACK01'));
    if (kind === 'foreign manifest')
      bytes = reseal(bytes, (m) => {
        m.format = 'maschinenlog_backup';
      });
    if (kind === 'unsupported KDF') bytes[11]! ^= 1;
    if (kind === 'manifest hash')
      bytes = reseal(bytes, (m) => {
        m.files[0]!.sha256 = 'f'.repeat(64);
      });
    const f = await setup();
    const replace = vi.spyOn(f.repo, 'replace');
    await expect(
      nativeCodec().decode(
        bytes,
        kind === 'password' ? 'Wrong password' : password,
      ),
    ).rejects.toThrow(/Passwort|beschädigt|SerienLog|nicht unterstützt/);
    expect(replace).not.toHaveBeenCalled();
    expect((await f.repo.snapshot()).records).toHaveLength(0);
  },
);

it.each(['sha256', 'size'] as const)(
  'checks every reused file reference for conflicting %s values',
  async (field) => {
    const decoded = await nativeCodec().decode(await legacyBytes(), password);
    const pdf = decoded.data.entries[1]!.attachments.find(
      (a) => a.kind === 'pdf',
    )!;
    if (field === 'sha256') pdf.sha256 = 'f'.repeat(64);
    else pdf.size -= 1;
    await expect(
      nativeCodec().encode(decoded.data, decoded.files, password),
    ).rejects.toThrow('Anhangsreferenz');
  },
);

it.each([
  'missing',
  'changed photo',
  'broken PDF',
  'broken JPEG',
  'PDF pages',
] as const)('rejects %s while preparing an export', async (kind) => {
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  const photo = decoded.data.entries[0]!.attachments[0]!;
  const pdf = decoded.data.entries[0]!.attachments.find(
    (a) => a.kind === 'pdf',
  )!;
  if (kind === 'missing') decoded.files.delete(photo.file);
  if (kind === 'changed photo') decoded.files.get(photo.file)![10]! ^= 1;
  if (kind === 'broken PDF') {
    const broken = new TextEncoder().encode(
      '%PDF-1.7\nSYNTHETIC_INVALID_PDF\n%%EOF',
    );
    decoded.files.set(pdf.file, broken);
    for (const item of decoded.data.entries
      .flatMap(allAttachments)
      .filter((a) => a.file === pdf.file)) {
      item.sha256 = createHash('sha256').update(broken).digest('hex');
      item.size = broken.length;
    }
  }
  if (kind === 'broken JPEG') {
    const broken = new Uint8Array([1, 2, 3, 4]);
    decoded.files.set(photo.file, broken);
    for (const item of decoded.data.entries
      .flatMap(allAttachments)
      .filter((a) => a.file === photo.file)) {
      item.sha256 = createHash('sha256').update(broken).digest('hex');
      item.size = broken.length;
    }
  }
  if (kind === 'PDF pages')
    for (const item of decoded.data.entries
      .flatMap(allAttachments)
      .filter((a) => a.kind === 'pdf'))
      item.pages! += 1;
  await expect(
    nativeCodec().encode(decoded.data, decoded.files, password),
  ).rejects.toThrow();
});

it('caches stored-file checks only within one restore and repairs missing photos without losing newer local corrections', async () => {
  const f = await setup();
  const service = new BackupService(f.series, nativeCodec());
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  await service.restore(decoded);
  const entry = (await f.repo.snapshot()).entries[0]!;
  const edit = await f.series.draft(entry.recordId, entry);
  edit.form.episode = '59';
  edit.form.note = 'NEWER_SYNTHETIC_CORRECTION';
  await f.series.saveEntry(edit);
  await f.vault.remove(entry.attachments[0]!.file);
  await f.series.saveRecord(record({ name: 'UNRELATED_LOCAL_SERIES' }));
  const read = vi.spyOn(f.vault, 'read');
  vi.clearAllMocks();
  await service.restore(decoded);
  const paths = read.mock.calls.map(([key]) => key);
  expect(paths.length).toBe(new Set(paths).size);
  const restored = (await f.repo.entry(entry.id))!;
  expect(restored.episode).toBe(59);
  expect(restored.note).toBe('NEWER_SYNTHETIC_CORRECTION');
  expect((await f.repo.snapshot()).records).toHaveLength(2);
  expect(
    createHash('sha256')
      .update(await f.vault.read(restored.attachments[0]!.file))
      .digest('hex'),
  ).toBe(restored.attachments[0]!.sha256);
  // A later backup must read again, so an earlier operation cannot hide damage.
  await writeFile(
    f.vault.uri(restored.attachments[0]!.file),
    new Uint8Array([1, 2, 3]),
  );
  await expect(service.create(password)).rejects.toThrow();
});

it('aborts a corrupt staged write without replacing SQLite or retaining temporary files', async () => {
  const f = await setup();
  const service = new BackupService(f.series, nativeCodec());
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  const before = await f.repo.snapshot();
  const put = f.vault.put.bind(f.vault);
  vi.spyOn(f.vault, 'put').mockImplementation(async (bytes, extension) => {
    const key = await put(bytes, extension);
    await writeFile(f.vault.uri(key), new Uint8Array([1, 2, 3]));
    return key;
  });
  await expect(service.restore(decoded)).rejects.toThrow(
    'unverändert gespeichert',
  );
  expect(await f.repo.snapshot()).toEqual(before);
  expect(await f.vault.list()).toEqual([]);
});

it('rolls back SQLite and staged files after a database failure while preserving local drafts', async () => {
  const f = await setup();
  const local = record({ name: 'Vorhandene lokale Serie' });
  await f.series.saveRecord(local);
  const draft = await f.series.draft(local.id);
  const before = await f.repo.snapshot();
  const service = new BackupService(f.series, nativeCodec());
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  f.raw.exec(
    "CREATE TRIGGER reject_restore BEFORE INSERT ON entries BEGIN SELECT RAISE(ABORT,'SYNTHETIC_SQL_FAILURE'); END;",
  );
  await expect(service.restore(decoded)).rejects.toThrow(
    'SYNTHETIC_SQL_FAILURE',
  );
  expect(await f.repo.snapshot()).toEqual(before);
  expect(await f.repo.drafts()).toEqual([draft]);
  expect(await f.vault.list()).toEqual([]);
});

it('rejects incoming bytes changed after decoding before they can replace local data', async () => {
  const f = await setup();
  const service = new BackupService(f.series, nativeCodec());
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  const before = await f.repo.snapshot();
  decoded.files.values().next().value![10]! ^= 1;
  await expect(service.restore(decoded)).rejects.toThrow('Anhangsreferenz');
  expect(await f.repo.snapshot()).toEqual(before);
  expect(await f.vault.list()).toEqual([]);
});

it('does not fall back after native errors and clears the key and plaintext after encryption failure', async () => {
  const derived: Uint8Array[] = [],
    plaintext: Uint8Array[] = [];
  const failed = new BackupCodec(
    env,
    async (...args) => {
      const key = await passwordKey(...args);
      derived.push(key);
      return key;
    },
    {
      ...expoBackupCrypto,
      async encrypt(key, nonce, header, bytes) {
        plaintext.push(bytes);
        throw new Error('SYNTHETIC_NATIVE_FAILURE');
      },
    },
  );
  await expect(
    failed.encode(
      { records: [], entries: [], reports: [] },
      new Map(),
      password,
    ),
  ).rejects.toThrow('SYNTHETIC_NATIVE_FAILURE');
  expect(derived[0]!.every((byte) => byte === 0)).toBe(true);
  expect(plaintext[0]!.every((byte) => byte === 0)).toBe(true);
  const decoded = await nativeCodec().decode(await legacyBytes(), password);
  native.hash.mockImplementationOnce(() => {
    throw new Error('SYNTHETIC_HASH_FAILURE');
  });
  await expect(
    nativeCodec().encode(decoded.data, decoded.files, password),
  ).rejects.toThrow('SYNTHETIC_HASH_FAILURE');
});
