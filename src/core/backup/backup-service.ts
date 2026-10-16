import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes } from '@noble/hashes/utils.js';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import {
  fileKey,
  snapshotFiles,
  validateSnapshot,
  type Snapshot,
} from '../domain/models';
import { nobleBackupCrypto, type BackupCrypto } from './backup-crypto';
import {
  progressReporter,
  type OnBackupProgress,
  type ProgressReporter,
} from './backup-progress';
import { inspectPdf } from '../pdf/pdf-service';
import { ContentLimitError, MAX_FILE_BYTES } from '../files/limits';
import type { Environment } from '../ports';
import type { SeriesService } from '../../features/entries/entry-service';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const MAGIC = encoder.encode('SLBACK01');
const ITERATIONS = 600000;
export const MAX_BACKUP_BYTES = 128 * 1024 * 1024;
export const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
export const MAX_BACKUP_FILES = 30000;
// 40-byte authenticated header, 16-byte tag and 4-byte manifest length.
const CONTAINER_OVERHEAD = 60;
export function checkBackupSize(
  manifestBytes: number,
  fileBytes: number,
): void {
  if (manifestBytes > MAX_MANIFEST_BYTES)
    throw new ContentLimitError(
      'Die Textdaten und das Dateiverzeichnis des Backups überschreiten die Grenze von 16 MiB. Es wurde keine Sicherung erstellt oder übernommen.',
    );
  if (manifestBytes + fileBytes + CONTAINER_OVERHEAD > MAX_BACKUP_BYTES)
    throw new ContentLimitError(
      'Das Backup überschreitet die Grenze von 128 MB.',
    );
}
export type PasswordKey = (
  password: string,
  salt: Uint8Array,
  iterations: number,
) => Promise<Uint8Array>;
export const noblePasswordKey: PasswordKey = (password, salt, iterations) =>
  pbkdf2Async(sha256, encoder.encode(password), salt, {
    c: iterations,
    dkLen: 32,
    asyncTick: 8,
  });
const descriptorsSchema = z
  .array(
    z
      .object({
        file: fileKey,
        size: z.number().int().positive().max(MAX_FILE_BYTES),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  )
  .max(MAX_BACKUP_FILES);
const manifestSchema = z
  .object({
    format: z.literal('serienlog_backup'),
    version: z.literal(1),
    createdAt: z.string().datetime({ offset: true }),
    data: z.unknown(),
    files: descriptorsSchema,
  })
  .strict();
type Descriptor = z.infer<typeof descriptorsSchema>[number];
async function validateContents(
  data: Snapshot,
  files: Map<string, Uint8Array>,
  crypto: BackupCrypto,
  report: ProgressReporter,
  expectedDescriptors?: Descriptor[],
): Promise<Descriptor[]> {
  if (files.size > MAX_BACKUP_FILES)
    throw new ContentLimitError(
      'Das Backup überschreitet die Grenze von 30000 Dateien.',
    );
  const items = [
    ...data.entries.flatMap((e) => e.attachments),
    ...data.reports,
  ];
  const labels = new Map(
    items.map((item) => [
      item.file,
      `${'full' in item ? 'Protokoll' : 'Anhang'} „${item.name}“`,
    ]),
  );
  if (
    files.size !== snapshotFiles(data).length ||
    (expectedDescriptors && files.size !== expectedDescriptors.length)
  )
    throw new Error('Unvollständiges Inhaltsverzeichnis.');
  const expected = new Map(expectedDescriptors?.map((d) => [d.file, d]));
  if (expectedDescriptors && expected.size !== expectedDescriptors.length)
    throw new Error('Doppelte Datei im Inhaltsverzeichnis.');
  const descriptors: Descriptor[] = [];
  const verified = new Map<
    string,
    { sha256: string; size: number; pages?: number }
  >();
  await report({
    phase: 'checking',
    completedFiles: 0,
    totalFiles: files.size,
  });
  for (const [file, bytes] of files) {
    try {
      if (bytes.length > MAX_FILE_BYTES)
        throw new ContentLimitError(
          'Die Datei überschreitet die Grenze von 50 MB.',
        );
      const descriptor = descriptorsSchema.element.parse({
        file,
        size: bytes.length,
        sha256: await crypto.hash(bytes),
      });
      const original = expected.get(file);
      if (
        expectedDescriptors &&
        (!original ||
          original.size !== descriptor.size ||
          original.sha256 !== descriptor.sha256)
      )
        throw new Error('Die Datei fehlt oder ihre Prüfsumme ist ungültig.');
      let pages: number | undefined;
      if (file.endsWith('.pdf'))
        pages = (await inspectPdf(bytes)).getPageCount();
      else {
        const probe = await PDFDocument.create();
        await probe.embedJpg(bytes);
      }
      verified.set(file, {
        size: bytes.length,
        sha256: descriptor.sha256,
        pages,
      });
      descriptors.push(descriptor);
    } catch (error) {
      const message = `${labels.get(file) ?? 'Backup-Datei'}: ${error instanceof Error ? error.message : 'Datei nicht lesbar.'}`;
      if (error instanceof ContentLimitError)
        throw new ContentLimitError(message);
      throw new Error(message);
    }
    await report({
      phase: 'checking',
      completedFiles: verified.size,
      totalFiles: files.size,
    });
  }
  for (const item of items) {
    const file = verified.get(item.file);
    if (
      !file ||
      file.sha256 !== item.sha256 ||
      ('size' in item && file.size !== item.size)
    )
      throw new Error(
        `${labels.get(item.file)}: Eine Anhangsreferenz ist beschädigt.`,
      );
    if ('kind' in item && item.kind === 'pdf' && item.pages !== file.pages)
      throw new Error(`${labels.get(item.file)}: Ungültige Seitenzahl.`);
  }
  return descriptors;
}
type DecodedBackup = {
  data: Snapshot;
  files: Map<string, Uint8Array>;
  createdAt: string;
};
function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
}
function integer(bytes: Uint8Array, offset: number): number {
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(offset);
}
export class BackupCodec {
  constructor(
    private env: Environment,
    private passwordKey: PasswordKey = noblePasswordKey,
    readonly crypto: BackupCrypto = nobleBackupCrypto,
  ) {}
  async encode(
    data: Snapshot,
    files: Map<string, Uint8Array>,
    password: string,
    onProgress?: OnBackupProgress,
  ): Promise<Uint8Array> {
    if (password.length < 6 || password.length > 1024)
      throw new Error('Bitte ein Passwort mit 6 bis 1024 Zeichen verwenden.');
    if (files.size > MAX_BACKUP_FILES)
      throw new ContentLimitError(
        'Das Backup überschreitet die Grenze von 30000 Dateien.',
      );
    const validated = validateSnapshot(data);
    const fileBytes = [...files.values()].reduce((sum, b) => sum + b.length, 0);
    checkBackupSize(0, fileBytes);
    const report = progressReporter(onProgress);
    const descriptors = await validateContents(
      validated,
      files,
      this.crypto,
      report,
    );
    const metadata = {
      format: 'serienlog_backup',
      version: 1,
      createdAt: this.env.now(),
      data: validated,
      files: descriptors,
    };
    const manifest = encoder.encode(JSON.stringify(metadata));
    let payload: Uint8Array | undefined;
    let key: Uint8Array | undefined;
    try {
      checkBackupSize(manifest.length, fileBytes);
      manifestSchema.parse(metadata);
      payload = concatBytes(u32(manifest.length), manifest, ...files.values());
      await report({ phase: 'encrypting' });
      const salt = this.env.random(16);
      const nonce = this.env.random(12);
      const header = concatBytes(MAGIC, u32(ITERATIONS), salt, nonce);
      key = await this.passwordKey(password, salt, ITERATIONS);
      return concatBytes(
        header,
        await this.crypto.encrypt(key, nonce, header, payload),
      );
    } finally {
      key?.fill(0);
      payload?.fill(0);
      manifest.fill(0);
    }
  }
  async decode(
    bytes: Uint8Array,
    password: string,
    onProgress?: OnBackupProgress,
  ): Promise<DecodedBackup> {
    if (bytes.length > MAX_BACKUP_BYTES)
      throw new ContentLimitError(
        'Das Backup überschreitet die Grenze von 128 MB.',
      );
    if (bytes.length < 60 || !MAGIC.every((b, i) => bytes[i] === b))
      throw new Error('Keine unterstützte SerienLog-Sicherung (.slbackup).');
    const iterations = integer(bytes, 8);
    if (iterations !== ITERATIONS)
      throw new Error(
        'Die Backup-Version oder Schlüsselableitung wird nicht unterstützt.',
      );
    if (password.length > 1024) throw new Error('Das Passwort ist zu lang.');
    const report = progressReporter(onProgress);
    await report({ phase: 'decrypting' });
    const key = await this.passwordKey(
      password,
      bytes.subarray(12, 28),
      iterations,
    );
    let payload: Uint8Array;
    try {
      payload = await this.crypto.decrypt(
        key,
        bytes.subarray(28, 40),
        bytes.subarray(0, 40),
        bytes.subarray(40),
      );
    } catch {
      throw new Error(
        'Das Passwort ist falsch oder das Backup wurde beschädigt.',
      );
    } finally {
      key.fill(0);
    }
    try {
      const length = integer(payload, 0);
      if (length > payload.length - 4)
        throw new Error('Ungültiges Inhaltsverzeichnis.');
      checkBackupSize(length, payload.length - 4 - length);
      const raw: unknown = JSON.parse(
        decoder.decode(payload.subarray(4, 4 + length)),
      );
      if (
        raw &&
        typeof raw === 'object' &&
        'files' in raw &&
        Array.isArray(raw.files) &&
        raw.files.length > MAX_BACKUP_FILES
      )
        throw new ContentLimitError(
          'Das Backup überschreitet die Grenze von 30000 Dateien.',
        );
      const manifest = manifestSchema.parse(raw);
      const data = validateSnapshot(manifest.data);
      const files = new Map<string, Uint8Array>();
      let offset = 4 + length;
      for (const descriptor of manifest.files) {
        if (
          files.has(descriptor.file) ||
          offset + descriptor.size > payload.length
        )
          throw new Error('Doppelte oder fehlende Datei.');
        const file = payload.slice(offset, offset + descriptor.size);
        offset += descriptor.size;
        files.set(descriptor.file, file);
      }
      if (
        offset !== payload.length ||
        files.size !== snapshotFiles(data).length
      )
        throw new Error('Unvollständiges Inhaltsverzeichnis.');
      await validateContents(data, files, this.crypto, report, manifest.files);
      return { data, files, createdAt: manifest.createdAt };
    } catch (error) {
      if (error instanceof ContentLimitError) throw error;
      throw new Error(
        'Das Backup enthält beschädigte oder unvollständige Daten. Es wurde nichts übernommen.',
      );
    } finally {
      payload.fill(0);
    }
  }
}
export class BackupService {
  constructor(
    private series: SeriesService,
    readonly codec: BackupCodec,
  ) {}
  create(password: string, onProgress?: OnBackupProgress): Promise<Uint8Array> {
    return this.series.queue.run(async () => {
      const report = progressReporter(onProgress);
      await report({ phase: 'preparing' });
      const data = await this.series.repository.snapshot();
      const keys = snapshotFiles(data);
      if (keys.length > MAX_BACKUP_FILES)
        throw new ContentLimitError(
          'Das Backup überschreitet die Grenze von 30000 Dateien.',
        );
      const files = new Map<string, Uint8Array>();
      let size = 0;
      for (const file of keys) {
        let bytes: Uint8Array;
        try {
          bytes = await this.series.vault.read(file);
        } catch {
          throw new Error(
            'Ein Anhang fehlt. Bitte die Datei ersetzen oder aus einem Backup wiederherstellen.',
          );
        }
        size += bytes.length;
        checkBackupSize(0, size);
        files.set(file, bytes);
        await report({
          phase: 'preparing',
          completedFiles: files.size,
          totalFiles: keys.length,
        });
      }
      return this.codec.encode(data, files, password, onProgress);
    });
  }
  restore(
    decoded: DecodedBackup,
    onProgress?: OnBackupProgress,
  ): Promise<{ warnings: string[] }> {
    return this.series.queue.run(async () => {
      const report = progressReporter(onProgress);
      await report({
        phase: 'restoring',
        completedFiles: 0,
        totalFiles: decoded.files.size,
      });
      const old = await this.series.repository.snapshot();
      const staged: string[] = [];
      type CheckedFile = { sha256: string; size: number };
      const checked = new Map<string, CheckedFile | null>();
      const inspectStored = async (file: string) => {
        if (checked.has(file)) return checked.get(file) ?? null;
        let bytes: Uint8Array;
        try {
          bytes = await this.series.vault.read(file);
        } catch {
          checked.set(file, null);
          return null;
        }
        const result = {
          sha256: await this.codec.crypto.hash(bytes),
          size: bytes.length,
        };
        checked.set(file, result);
        return result;
      };
      try {
        const references = new Map<
          string,
          { sha256: string; size?: number }[]
        >();
        for (const item of [
          ...decoded.data.entries.flatMap((e) => e.attachments),
          ...decoded.data.reports,
        ]) {
          const rows = references.get(item.file) ?? [];
          rows.push(item);
          references.set(item.file, rows);
        }
        if (references.size !== decoded.files.size)
          throw new Error('Unvollständiges Inhaltsverzeichnis.');
        const mapping = new Map<string, string>();
        const hashes = new Map<string, CheckedFile & { file: string }>();
        for (const [key, bytes] of decoded.files) {
          const sha256 = await this.codec.crypto.hash(bytes);
          const rows = references.get(key);
          if (
            !rows ||
            rows.some(
              (item) =>
                item.sha256 !== sha256 ||
                (item.size !== undefined && item.size !== bytes.length),
            )
          )
            throw new Error(
              'Eine Anhangsreferenz des Backups ist beschädigt. Es wurde nichts übernommen.',
            );
          const file = await this.series.vault.put(
            bytes,
            key.endsWith('.pdf') ? 'pdf' : 'jpg',
          );
          staged.push(file);
          const stored = await inspectStored(file);
          if (stored?.sha256 !== sha256 || stored.size !== bytes.length)
            throw new Error(
              'Eine Backup-Datei konnte nicht unverändert gespeichert werden. Es wurde nichts übernommen.',
            );
          mapping.set(key, file);
          hashes.set(sha256, { ...stored, file });
          await report({
            phase: 'restoring',
            completedFiles: staged.length,
            totalFiles: decoded.files.size,
          });
        }
        const incoming = JSON.parse(JSON.stringify(decoded.data)) as Snapshot;
        for (const item of [
          ...incoming.entries.flatMap((e) => e.attachments),
          ...incoming.reports,
        ])
          item.file = mapping.get(item.file)!;
        const records = new Map(old.records.map((r) => [r.id, r]));
        for (const record of incoming.records)
          if (
            !records.has(record.id) ||
            records.get(record.id)!.updatedAt < record.updatedAt
          )
            records.set(record.id, record);
        const entries = new Map(old.entries.map((e) => [e.id, e]));
        for (const entry of incoming.entries)
          if (
            !entries.has(entry.id) ||
            entries.get(entry.id)!.updatedAt < entry.updatedAt
          )
            entries.set(entry.id, entry);
        const reports = new Map(old.reports.map((r) => [r.id, r]));
        for (const report of incoming.reports) {
          if (
            reports.has(report.id) &&
            reports.get(report.id)!.sha256 !== report.sha256
          )
            throw new Error(
              'Ein gleichnamiges gespeichertes Protokoll hat einen anderen Inhalt. Wiederherstellung abgebrochen.',
            );
          if (!reports.has(report.id)) reports.set(report.id, report);
        }
        const data: Snapshot = {
          records: [...records.values()],
          entries: [...entries.values()],
          reports: [...reports.values()],
        };
        const items = [
          ...data.entries.flatMap((e) => e.attachments),
          ...data.reports,
        ];
        const keys = [...new Set(items.map((item) => item.file))];
        await report({
          phase: 'checking',
          completedFiles: 0,
          totalFiles: keys.length,
        });
        for (const [index, file] of keys.entries()) {
          await inspectStored(file);
          await report({
            phase: 'checking',
            completedFiles: index + 1,
            totalFiles: keys.length,
          });
        }
        // Cache bytes' actual integrity, not whether one reference matched.
        // Every attachment and report reference still checks its own hash and size.
        for (const item of items) {
          const stored = checked.get(item.file);
          if (
            !stored ||
            stored.sha256 !== item.sha256 ||
            ('size' in item && stored.size !== item.size)
          ) {
            const repaired = hashes.get(item.sha256);
            if (repaired && (!('size' in item) || repaired.size === item.size))
              item.file = repaired.file;
            // Unrelated missing local files do not invalidate the incoming backup.
          }
        }
        await report({ phase: 'restoring' });
        await this.series.repository.replace(data);
        await this.series.cleanup([...snapshotFiles(old), ...staged]);
        return { warnings: await this.series.syncReminders() };
      } catch (error) {
        await this.series.cleanup(staged);
        throw error;
      }
    });
  }
}
