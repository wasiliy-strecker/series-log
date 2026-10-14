import { afterEach, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { fixture, record, env, connect } from './support';
import { SqlRepository } from '../src/core/database/repository';

const fixtures: Awaited<ReturnType<typeof fixture>>[] = [];
async function setup() {
  const f = await fixture();
  fixtures.push(f);
  return f;
}
afterEach(async () => {
  for (const f of fixtures.splice(0)) await f.close();
});

it('persists series, drafts and paginated searchable history across a database reopen', async () => {
  const f = await setup(),
    r = record();
  await f.series.saveRecord(r);
  for (let episode = 1; episode <= 12; episode++) {
    const d = await f.series.draft(r.id);
    d.form.episode = String(episode);
    d.form.occurredAt = `2026-09-${String(episode).padStart(2, '0')}T20:00:00.000Z`;
    d.form.note = episode === 3 ? 'Lieblingsfolge' : '';
    await f.series.saveEntry(d);
  }
  const draft = await f.series.draft(r.id);
  draft.form.note = 'Nicht vergessen';
  await f.series.persistDraft(draft);
  const reopened = connect(f.path);
  try {
    const repo = new SqlRepository(reopened.db);
    expect((await repo.dashboard())[0]?.latest?.episode).toBe(12);
    expect(await repo.entries(r.id)).toMatchObject({
      total: 12,
      rows: expect.arrayContaining([expect.objectContaining({ episode: 12 })]),
    });
    expect((await repo.entries(r.id, '', 10)).rows).toHaveLength(2);
    expect((await repo.entries(r.id, 'Lieblingsfolge')).rows[0]?.episode).toBe(
      3,
    );
    expect((await repo.entries(r.id, 'Folge 12')).total).toBe(1);
    expect((await repo.entries(r.id, '12.9.2026')).total).toBe(1);
    expect((await repo.drafts())[0]?.form.note).toBe('Nicht vergessen');
  } finally {
    reopened.raw.close();
  }
});

it('saves an episode stand and removes its draft atomically, rolling back on SQL failure', async () => {
  const f = await setup(),
    r = record();
  await f.series.saveRecord(r);
  const savedRecord = (await f.repo.records())[0]!;
  const d = await f.series.draft(r.id);
  d.form.season = '2';
  d.form.episode = '3';
  await f.series.persistDraft(d);
  f.raw.exec(
    "CREATE TRIGGER fail_entry BEFORE INSERT ON entries BEGIN SELECT RAISE(ABORT,'synthetic'); END;",
  );
  await expect(f.series.saveEntry(d)).rejects.toThrow();
  expect((await f.repo.entries(r.id)).total).toBe(0);
  expect(await f.repo.drafts()).toHaveLength(1);
  f.raw.exec('DROP TRIGGER fail_entry');
  await f.series.saveEntry(d);
  expect((await f.repo.records())[0]).toEqual(savedRecord);
  expect((await f.repo.dashboard())[0]?.latest).toMatchObject({
    season: 2,
    episode: 3,
  });
  expect(await f.repo.drafts()).toHaveLength(0);
});

it('saves arbitrary episode stands and lower seasons independently of legacy counts', async () => {
  const f = await setup();
  const r = record();
  await f.db.run(
    'INSERT INTO records VALUES (?,?)',
    r.id,
    JSON.stringify({ ...r, totalEpisodes: 2, seasons: [1, 1] }),
  );
  expect((await f.repo.records())[0]).toEqual(r);
  expect((await f.repo.dashboard())[0]?.record).toEqual(r);
  const first = await f.series.draft(r.id);
  first.form.season = '3';
  first.form.episode = '3';
  first.form.occurredAt = '2026-10-13T20:00:00.000Z';
  await f.series.saveEntry(first);
  const next = await f.series.draft(r.id);
  next.form.season = '2';
  next.form.episode = '2';
  next.form.occurredAt = '2026-10-13T21:00:00.000Z';
  await f.series.persistDraft(next);
  const restored = (await f.repo.drafts())[0]!;
  await f.series.saveEntry(restored);
  expect((await f.repo.dashboard())[0]?.latest).toMatchObject({
    season: 2,
    episode: 2,
  });
  expect(
    (await f.repo.entries(r.id)).rows.map((entry) => [
      entry.season,
      entry.episode,
    ]),
  ).toEqual([
    [2, 2],
    [3, 3],
  ]);
  expect(await f.repo.drafts()).toHaveLength(0);
  const last = await f.series.draft(r.id);
  last.form.episode = '59';
  const saved = await f.series.saveEntry(last);
  expect(saved.entry).toMatchObject({ season: 2, episode: 59 });
  const invalid = await f.series.draft(r.id);
  invalid.form.season = '';
  invalid.form.episode = '1';
  await expect(f.series.saveEntry(invalid)).rejects.toThrow('Staffel:');
  invalid.form.season = '1';
  invalid.form.episode = '0';
  await expect(f.series.saveEntry(invalid)).rejects.toThrow('Folge:');
  expect((await f.repo.entries(r.id)).total).toBe(3);
});

it('selects the same latest saved series photo for the dashboard and details across edits and deletions', async () => {
  const f = await setup();
  const r = record();
  const other = record();
  await f.series.saveRecord(r);
  await f.series.saveRecord(other);
  const photos = await Promise.all(
    [1, 2, 3, 4, 5].map((value) =>
      f.series.importAttachment(
        new Uint8Array([value]),
        'photo',
        `Beispiel-${value}.jpg`,
      ),
    ),
  );
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const document = await f.series.importAttachment(
    await pdf.save(),
    'pdf',
    'Beispiel.pdf',
  );
  const firstDraft = await f.series.draft(r.id);
  firstDraft.form.episode = '1';
  firstDraft.form.occurredAt = '2026-09-01T20:00:00.000Z';
  firstDraft.form.attachments = [photos[0]!];
  const first = (await f.series.saveEntry(firstDraft)).entry;
  const secondDraft = await f.series.draft(r.id);
  secondDraft.form.episode = '2';
  secondDraft.form.occurredAt = '2026-09-02T20:00:00.000Z';
  secondDraft.form.attachments = [document, photos[1]!, photos[2]!];
  const second = (await f.series.saveEntry(secondDraft)).entry;
  for (let episode = 3; episode <= 14; episode++) {
    const draft = await f.series.draft(r.id);
    draft.form.episode = String(episode);
    draft.form.occurredAt = `2026-09-${String(episode).padStart(2, '0')}T20:00:00.000Z`;
    await f.series.saveEntry(draft);
  }
  const pending = await f.series.draft(r.id);
  pending.form.attachments = [photos[3]!];
  await f.series.persistDraft(pending);
  const otherDraft = await f.series.draft(other.id);
  otherDraft.form.episode = '1';
  otherDraft.form.attachments = [photos[4]!];
  await f.series.saveEntry(otherDraft);

  async function expectCover(attachment: (typeof photos)[number] | null) {
    const dashboard = (await f.repo.dashboard()).find(
      (item) => item.record.id === r.id,
    )!;
    expect(dashboard.latest?.episode).toBe(14);
    expect(dashboard.photo).toEqual(await f.repo.latestPhoto(r.id));
    expect(dashboard.photo?.attachment ?? null).toEqual(attachment);
  }
  expect((await f.repo.entries(r.id)).rows).not.toContainEqual(second);
  await expectCover(photos[1]!);
  expect(await f.repo.latestPhoto(r.id)).toMatchObject({
    entryId: second.id,
    occurredAt: second.occurredAt,
  });
  const editOld = await f.series.draft(r.id, first);
  editOld.form.note = 'Älteren Eintrag später bearbeiten';
  await f.series.saveEntry(editOld);
  await expectCover(photos[1]!);
  const editPhoto = await f.series.draft(r.id, second);
  editPhoto.form.attachments = [document, photos[2]!, photos[1]!];
  await f.series.saveEntry(editPhoto);
  await expectCover(photos[2]!);
  await f.series.delete('entry', second.id);
  await expectCover(photos[0]!);
  await f.series.delete('entry', first.id);
  await expectCover(null);
  expect((await f.repo.latestPhoto(other.id))?.attachment).toEqual(photos[4]);
});

it('edits independent stands, renders a PDF, and deletes only associated entries and reports', async () => {
  const f = await setup(),
    r = record(),
    other = record();
  await f.series.saveRecord(r);
  await f.series.saveRecord(other);
  const d = await f.series.draft(r.id);
  d.form.episode = '7';
  const { entry } = await f.series.saveEntry(d);
  await f.series.saveRecord({ ...r, name: 'Neuer Titel' });
  const edit = await f.series.draft(r.id, entry);
  edit.form.episode = '6';
  edit.form.note = 'Korrektur';
  await f.series.saveEntry(edit);
  expect((await f.repo.entries(r.id)).total).toBe(1);
  const report = await f.series.createReport(r.id, entry.id, false);
  expect(
    (await PDFDocument.load(await f.vault.read(report.file))).getPageCount(),
  ).toBeGreaterThan(0);
  await f.series.delete('record', r.id);
  expect((await f.repo.records()).map((r) => r.id)).toEqual([other.id]);
  expect(await f.repo.reports(r.id)).toEqual([]);
  expect(await f.vault.list()).toEqual([]);
});

it('keeps shared files alive while a draft still references them', async () => {
  const f = await setup(),
    r = record();
  await f.series.saveRecord(r);
  const photo = await f.series.importAttachment(
    new Uint8Array([1, 2, 3]),
    'photo',
    'Synthetic.jpg',
  );
  const d = await f.series.draft(r.id);
  d.form.episode = '1';
  d.form.attachments = [photo];
  const { entry } = await f.series.saveEntry(d);
  const next = await f.series.draft(r.id);
  next.form.attachments = [photo];
  await f.series.persistDraft(next);
  await f.series.delete('entry', entry.id);
  expect(await f.vault.list()).toContain(photo.file);
  await f.series.discard(next);
  expect(await f.vault.list()).toEqual([]);
  expect(await f.repo.entry(env.id())).toBeNull();
});
