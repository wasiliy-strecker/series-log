import { validateProgress } from './progress';
import { z } from 'zod';
import { MAX_FILE_BYTES, MAX_PDF_PAGES } from '../files/limits';

const id = z.string().uuid();
const short = z.string().max(500);
const note = z.string().max(20000);
const timestamp = z.string().datetime({ offset: true });
export const fileKey = z.string().regex(/^[a-f0-9-]{36}\.(jpg|pdf)$/);
export const attachmentSchema = z
  .object({
    id,
    kind: z.enum(['photo', 'pdf']),
    name: short.min(1),
    file: fileKey,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    size: z.number().int().positive().max(MAX_FILE_BYTES),
    pages: z.number().int().positive().max(MAX_PDF_PAGES).optional(),
    source: z.enum(['scanned', 'imported']).optional(),
  })
  .strict();
export const reminderSchema = z
  .object({
    interval: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    deliveryMode: z.enum(['normal', 'punctualWithSound']),
    startsAtMillis: z.number().int().nonnegative(),
  })
  .strict()
  .refine((r) => r.interval !== 'weekly' || r.day <= 7, {
    message: 'Wochentag muss zwischen 1 und 7 liegen.',
  });
export const recordSchema = z
  .object({
    id,
    name: short.trim().min(1, 'Bitte einen Serientitel eingeben.'),
    category: short.trim().min(1, 'Bitte ein Genre eingeben.'),
    totalEpisodes: z.number().int().min(1).max(1000000).nullable(),
    seasons: z.array(z.number().int().min(1).max(1000000).nullable()).max(200),
    note,
    reminder: reminderSchema.nullable(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();
export const entrySchema = z
  .object({
    id,
    recordId: id,
    season: z.number().int().min(1).max(200),
    episode: z.number().int().min(0).max(1000000),
    occurredAt: timestamp,
    note,
    attachments: z.array(attachmentSchema).max(200),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict();
export const reportSchema = z
  .object({
    id,
    recordId: id,
    entryId: id.nullable(),
    name: short,
    file: fileKey,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    createdAt: timestamp,
    full: z.boolean(),
    groupId: id.optional(),
    partIndex: z.number().int().positive().optional(),
    partCount: z.number().int().min(2).max(20).optional(),
  })
  .strict();
export const snapshotSchema = z
  .object({
    records: z.array(recordSchema).max(10000),
    entries: z.array(entrySchema).max(100000),
    reports: z.array(reportSchema).max(20000),
  })
  .strict();
export type SeriesRecord = z.infer<typeof recordSchema>;
export type EpisodeEntry = z.infer<typeof entrySchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type SavedReport = z.infer<typeof reportSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
export type EntryForm = {
  season: string;
  episode: string;
  occurredAt: string;
  note: string;
  attachments: Attachment[];
};
export type EntryDraft = {
  id: string;
  recordId: string;
  entryId: string | null;
  createdAt: string;
  form: EntryForm;
  updatedAt: string;
  external: 'camera' | 'gallery' | null;
  completedSeason?: { season: number; episodes: number };
  captureStage?: 'choose' | 'form';
  captureSource?: 'manual' | 'photo';
};
export const categories = [
  'Drama',
  'Krimi',
  'Thriller',
  'Comedy',
  'Science-Fiction',
  'Fantasy',
  'Action',
  'Animation',
  'Dokumentation',
  'Sonstiges',
];
export const PAGE_SIZE = 10;
export function snapshotFiles(data: Snapshot): string[] {
  return [
    ...new Set([
      ...data.entries.flatMap((e) => e.attachments.map((a) => a.file)),
      ...data.reports.map((r) => r.file),
    ]),
  ];
}
export function validateSnapshot(input: unknown): Snapshot {
  const data = snapshotSchema.parse(input);
  for (const rows of [data.records, data.entries, data.reports]) {
    if (new Set(rows.map((r) => r.id)).size !== rows.length)
      throw new Error('Doppelte IDs im Backup.');
  }
  const records = new Set(data.records.map((r) => r.id));
  const entries = new Map(data.entries.map((e) => [e.id, e.recordId]));
  for (const e of data.entries) {
    if (
      !records.has(e.recordId) ||
      new Set(e.attachments.map((a) => a.id)).size !== e.attachments.length
    )
      throw new Error('Ungültige Zuordnung im Backup.');
    for (const a of e.attachments)
      if ((a.kind === 'pdf') !== a.file.endsWith('.pdf'))
        throw new Error('Ungültiger Anhangstyp.');
  }
  for (const r of data.reports) {
    if (
      !records.has(r.recordId) ||
      (r.entryId && entries.get(r.entryId) !== r.recordId) ||
      !r.file.endsWith('.pdf')
    )
      throw new Error('Ungültiges Protokoll im Backup.');
    if (
      (r.groupId || r.partIndex || r.partCount) &&
      (!r.groupId || !r.partIndex || !r.partCount || r.partIndex > r.partCount)
    )
      throw new Error('Ungültige Protokollteile.');
  }
  const groups = new Map<string, SavedReport[]>();
  for (const report of data.reports)
    if (report.groupId)
      groups.set(report.groupId, [
        ...(groups.get(report.groupId) ?? []),
        report,
      ]);
  for (const reports of groups.values()) {
    const first = reports[0]!;
    if (
      new Set(reports.map((r) => r.partIndex)).size !== reports.length ||
      reports.some(
        (r) =>
          r.recordId !== first.recordId ||
          r.entryId !== first.entryId ||
          r.createdAt !== first.createdAt ||
          r.full !== first.full ||
          r.partCount !== first.partCount,
      )
    )
      throw new Error('Widersprüchliche Protokollteile.');
  }
  for (const record of data.records)
    validateProgress(
      record,
      data.entries.filter((e) => e.recordId === record.id),
    );
  return data;
}
