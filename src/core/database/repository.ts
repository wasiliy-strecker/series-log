import {
  SerialQueue,
  type Repository,
  type SqlConnection,
  type ReportPageRequest,
} from '../ports';
import {
  type EpisodeEntry,
  type SeriesRecord,
  type SavedReport,
  type Snapshot,
  type EntryDraft,
  type SeriesPhoto,
  PAGE_SIZE,
  recordSchema,
  entrySchema,
  reportSchema,
  validateSnapshot,
} from '../domain/models';

function latestPhotoQuery(recordId: '?' | 'r.id') {
  return `SELECT json_object('attachment',json(a.value),'entryId',e.id,'occurredAt',e.occurred_at) body
    FROM entries e,json_each(e.body,'$.attachments') a
    WHERE e.record_id=${recordId} AND json_extract(a.value,'$.kind')='photo'
    ORDER BY e.occurred_at DESC,e.id DESC,CAST(a.key AS INTEGER) ASC LIMIT 1`;
}

export const schemaV1 = `
CREATE TABLE records (id TEXT PRIMARY KEY, body TEXT NOT NULL CHECK(json_valid(body)));
CREATE TABLE entries (id TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE, occurred_at TEXT NOT NULL, search TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body)));
CREATE TABLE reports (id TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE, entry_id TEXT REFERENCES entries(id) ON DELETE CASCADE, body TEXT NOT NULL CHECK(json_valid(body)));
CREATE TABLE drafts (id TEXT PRIMARY KEY, record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE, body TEXT NOT NULL CHECK(json_valid(body)));
PRAGMA user_version=1;`;
export async function migrate(db: SqlConnection): Promise<void> {
  await db.exec(
    'PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;',
  );
  const version =
    (await db.all<{ user_version: number }>('PRAGMA user_version'))[0]
      ?.user_version ?? 0;
  if (version > 2)
    throw new Error(
      'Die Datenbank stammt aus einer neueren SerienLog-Version.',
    );
  await db.exec('BEGIN IMMEDIATE');
  try {
    if (version < 1) await db.exec(schemaV1);
    if (version < 2)
      await db.exec(
        'CREATE INDEX entries_history ON entries(record_id, occurred_at DESC, id DESC); CREATE INDEX reports_record ON reports(record_id); PRAGMA user_version=2;',
      );
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}
export class SqlRepository implements Repository {
  private queue = new SerialQueue();
  constructor(private db: SqlConnection) {}
  private async bodies<T>(
    table: string,
    where = '',
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    return (
      await this.db.all<{ body: string }>(
        `SELECT body FROM ${table} ${where}`,
        ...params,
      )
    ).map((r) => JSON.parse(r.body) as T);
  }
  private write<T>(work: () => Promise<T>): Promise<T> {
    return this.queue.run(async () => {
      await this.db.exec('BEGIN IMMEDIATE');
      try {
        const value = await work();
        await this.db.exec('COMMIT');
        return value;
      } catch (error) {
        await this.db.exec('ROLLBACK');
        throw error;
      }
    });
  }
  records() {
    return this.queue.run(async () =>
      (
        await this.bodies<SeriesRecord>(
          'records',
          "ORDER BY json_extract(body, '$.name') COLLATE NOCASE",
        )
      ).map((record) => recordSchema.parse(record)),
    );
  }
  entry(id: string) {
    return this.queue.run(
      async () =>
        (await this.bodies<EpisodeEntry>('entries', 'WHERE id=?', [id]))[0] ??
        null,
    );
  }
  dashboard() {
    return this.queue.run(async () => {
      const rows = await this.db.all<{
        body: string;
        latest: string | null;
        lastEdited: string;
        photo: string | null;
      }>(`
        SELECT r.body,
          (SELECT e.body FROM entries e WHERE e.record_id=r.id ORDER BY e.occurred_at DESC,e.id DESC LIMIT 1) latest,
          (${latestPhotoQuery('r.id')}) photo,
          max(json_extract(r.body,'$.updatedAt'),coalesce((SELECT max(json_extract(e.body,'$.updatedAt')) FROM entries e WHERE e.record_id=r.id),json_extract(r.body,'$.updatedAt'))) lastEdited
        FROM records r ORDER BY lastEdited DESC,r.id ASC`);
      return rows.map((row) => ({
        record: recordSchema.parse(JSON.parse(row.body)),
        latest: row.latest ? (JSON.parse(row.latest) as EpisodeEntry) : null,
        lastEdited: row.lastEdited,
        photo: row.photo ? (JSON.parse(row.photo) as SeriesPhoto) : null,
      }));
    });
  }
  latestPhoto(recordId: string) {
    return this.queue.run(async () => {
      const rows = await this.db.all<{ body: string }>(
        latestPhotoQuery('?'),
        recordId,
      );
      return rows[0] ? (JSON.parse(rows[0].body) as SeriesPhoto) : null;
    });
  }
  entries(recordId: string, search = '', offset = 0, limit = PAGE_SIZE) {
    return this.queue.run(async () => {
      const pattern = `%${search.toLocaleLowerCase('de-DE').replace(/[\\%_]/g, '\\$&')}%`;
      const clause = "WHERE record_id=? AND search LIKE ? ESCAPE '\\'";
      const rows = await this.bodies<EpisodeEntry>(
        'entries',
        `${clause} ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?`,
        [recordId, pattern, limit, offset],
      );
      const total =
        (
          await this.db.all<{ n: number }>(
            `SELECT count(*) n FROM entries ${clause}`,
            recordId,
            pattern,
          )
        )[0]?.n ?? 0;
      const any = await this.db.all<{ found: number }>(
        `SELECT EXISTS(
          SELECT 1 FROM entries e,json_each(e.body,'$.attachments') a
          WHERE e.record_id=? AND json_extract(a.value,'$.kind') IN ('photo','pdf')
        ) found`,
        recordId,
      );
      return { rows, total, hasAttachments: any[0]?.found === 1 };
    });
  }
  reports(recordId: string) {
    return this.queue.run(() =>
      this.bodies<SavedReport>(
        'reports',
        "WHERE record_id=? ORDER BY json_extract(body,'$.createdAt') DESC",
        [recordId],
      ),
    );
  }
  reportPage(request: ReportPageRequest) {
    return this.queue.run(async () => {
      const clause = 'WHERE record_id=? AND entry_id IS ?';
      const params = [request.recordId, request.entryId];
      const total =
        (
          await this.db.all<{ n: number }>(
            `SELECT count(*) n FROM reports ${clause}`,
            ...params,
          )
        )[0]?.n ?? 0;
      const lastOffset = Math.max(
        0,
        Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE,
      );
      const offset = Math.min(
        lastOffset,
        Math.max(0, Math.floor(request.offset / PAGE_SIZE) * PAGE_SIZE),
      );
      const rows = await this.bodies<SavedReport>(
        'reports',
        `${clause} ORDER BY json_extract(body,'$.createdAt') DESC, json_extract(body,'$.groupId') DESC, json_extract(body,'$.partIndex') ASC, id DESC LIMIT ? OFFSET ?`,
        [...params, PAGE_SIZE, offset],
      );
      return { rows, total, offset };
    });
  }
  drafts() {
    return this.queue.run(() => this.bodies<EntryDraft>('drafts'));
  }
  snapshot(): Promise<Snapshot> {
    return this.queue.run(async () =>
      validateSnapshot({
        records: await this.bodies('records'),
        entries: await this.bodies('entries'),
        reports: await this.bodies('reports'),
      }),
    );
  }
  saveDraft(draft: EntryDraft) {
    return this.write(() =>
      this.db.run(
        'INSERT INTO drafts VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body',
        draft.id,
        draft.recordId,
        JSON.stringify(draft),
      ),
    );
  }
  removeDraft(id: string) {
    return this.write(() => this.db.run('DELETE FROM drafts WHERE id=?', id));
  }
  private putRecord(record: SeriesRecord) {
    return this.db.run(
      'INSERT INTO records VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body',
      record.id,
      JSON.stringify(recordSchema.parse(record)),
    );
  }
  saveRecord(record: SeriesRecord) {
    return this.write(() => this.putRecord(record));
  }
  private async putEntry(entry: EpisodeEntry) {
    const e = entrySchema.parse(entry);
    const existing = (
      await this.db.all<{ record_id: string }>(
        'SELECT record_id FROM entries WHERE id=?',
        e.id,
      )
    )[0];
    if (existing && existing.record_id !== e.recordId)
      throw new Error(
        'Ein Eintrag kann nicht in eine andere Serie verschoben werden.',
      );
    await this.db.run(
      'INSERT INTO entries VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET occurred_at=excluded.occurred_at,search=excluded.search,body=excluded.body',
      e.id,
      e.recordId,
      e.occurredAt,
      `Staffel ${e.season} Folge ${e.episode} ${e.occurredAt} ${new Date(e.occurredAt).toLocaleDateString('de-DE')} ${new Date(e.occurredAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${e.note}`.toLocaleLowerCase(
        'de-DE',
      ),
      JSON.stringify(e),
    );
  }
  saveEntry(entry: EpisodeEntry, draftId: string) {
    return this.write(async () => {
      await this.putEntry(entry);
      await this.db.run('DELETE FROM drafts WHERE id=?', draftId);
    });
  }
  private putReport(report: SavedReport) {
    return this.db.run(
      'INSERT INTO reports VALUES (?,?,?,?)',
      report.id,
      report.recordId,
      report.entryId,
      JSON.stringify(reportSchema.parse(report)),
    );
  }
  saveReport(report: SavedReport) {
    return this.write(() => this.putReport(report));
  }
  saveReports(reports: SavedReport[]) {
    return this.write(async () => {
      for (const report of reports) await this.putReport(report);
    });
  }
  deleteRecord(id: string) {
    return this.write(() => this.db.run('DELETE FROM records WHERE id=?', id));
  }
  deleteEntry(id: string) {
    return this.write(async () => {
      await this.db.run(
        "DELETE FROM drafts WHERE json_extract(body,'$.entryId')=?",
        id,
      );
      await this.db.run('DELETE FROM entries WHERE id=?', id);
    });
  }
  deleteReport(id: string) {
    return this.write(() => this.db.run('DELETE FROM reports WHERE id=?', id));
  }
  replace(input: Snapshot) {
    const data = validateSnapshot(input);
    return this.write(async () => {
      const drafts = await this.bodies<EntryDraft>('drafts');
      await this.db.exec(
        'DELETE FROM drafts; DELETE FROM reports; DELETE FROM entries; DELETE FROM records;',
      );
      for (const r of data.records) await this.putRecord(r);
      for (const e of data.entries) await this.putEntry(e);
      for (const r of data.reports) await this.putReport(r);
      for (const draft of drafts)
        if (data.records.some((r) => r.id === draft.recordId))
          await this.db.run(
            'INSERT INTO drafts VALUES (?,?,?)',
            draft.id,
            draft.recordId,
            JSON.stringify(draft),
          );
    });
  }
}
