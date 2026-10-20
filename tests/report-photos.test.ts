import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PDFDocument, PDFName, PDFPage, PDFRawStream } from 'pdf-lib';
import type { Attachment } from '../src/core/domain/models';
import { ReportLayout } from '../src/core/pdf/report-layout';
import { fixture, record, sourcePdf } from './support';

let f: Awaited<ReturnType<typeof fixture>>;
let series = record();

beforeEach(async () => {
  f = await fixture();
  series = record();
  await f.series.saveRecord(series);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await f.close();
});

async function photo(marker: number) {
  const original = await readFile(
    new URL('./fixtures/photo.jpg', import.meta.url),
  );
  // A JPEG comment distinguishes valid images without another binary fixture.
  const bytes = new Uint8Array([
    ...original.subarray(0, 2),
    0xff,
    0xfe,
    0,
    3,
    marker,
    ...original.subarray(2),
  ]);
  return f.series.importAttachment(bytes, 'photo', `Foto ${marker}.jpg`);
}
async function entry(day: number, attachments: Attachment[]) {
  const draft = await f.series.draft(series.id);
  draft.form.episode = String(day);
  draft.form.occurredAt = `2026-10-${String(day).padStart(2, '0')}T20:00:00.000Z`;
  draft.form.note = `Notiz zum Stand ${day}`;
  draft.form.attachments = attachments;
  return (await f.series.saveEntry(draft)).entry;
}
async function images(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  return pdf.context
    .enumerateIndirectObjects()
    .map(([, object]) => object)
    .filter(
      (object): object is PDFRawStream =>
        object instanceof PDFRawStream &&
        object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'),
    )
    .map((image) => image.getContents());
}

it('embeds only the first photo of the newest stand while keeping older notes and PDF documents', async () => {
  const current = await photo(1);
  const extra = await photo(2);
  const old = await photo(3);
  const document = await f.series.importAttachment(
    await sourcePdf(),
    'pdf',
    'Altdokument.pdf',
  );
  // Insert out of chronological order. The selection follows the saved date.
  await entry(3, [current, extra]);
  await entry(1, [old, document]);
  await entry(2, []);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(true);
  const snapshot = await f.repo.snapshot();
  const text = vi.spyOn(ReportLayout.prototype, 'text');
  const history = vi.spyOn(ReportLayout.prototype, 'historyTable');
  const report = await f.series.createReport(series.id, null, true);
  const bytes = await f.vault.read(report.file);
  expect(await images(bytes)).toEqual([await f.vault.read(current.file)]);
  expect(history.mock.calls[0]![0].map((row) => row[2])).toEqual([
    'Staffel 1 · Folge 3',
    'Staffel 1 · Folge 2',
    'Staffel 1 · Folge 1',
  ]);
  for (const day of [1, 2, 3])
    expect(
      text.mock.calls.some(([value]) => value === `Notiz zum Stand ${day}`),
    ).toBe(true);
  expect(text.mock.calls.some(([value]) => value === document.name)).toBe(true);
  expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(2);
  expect((await f.repo.snapshot()).entries).toEqual(snapshot.entries);
  const compact = await f.series.createReport(series.id, null, false);
  expect(await images(await f.vault.read(compact.file))).toHaveLength(0);
});

it('uses the selected stand for a single report and still rejects a broken included photo', async () => {
  const first = await photo(1);
  const extra = await photo(2);
  const newer = await photo(3);
  const old = await entry(1, [first, extra]);
  await entry(2, [newer]);
  const report = await f.series.createReport(series.id, old.id, true);
  expect(await images(await f.vault.read(report.file))).toEqual([
    await f.vault.read(first.file),
  ]);
  await f.vault.remove(first.file);
  await expect(f.series.createReport(series.id, old.id, true)).rejects.toThrow(
    'Ein Anhang fehlt',
  );
  expect(await f.repo.reports(series.id)).toHaveLength(1);
});

it('uses the newest photo-bearing stand even when newer stands have no photo', async () => {
  const old = await photo(1);
  const current = await photo(2);
  const extra = await photo(3);
  await entry(2, [current, extra]);
  // A backdated stand saved afterwards must not override the newer photo.
  await entry(1, [old]);
  const latest = await entry(3, []);
  const page = await f.repo.entries(series.id, 'Notiz zum Stand 3', 0, 1);
  expect(page.rows.map((entry) => entry.id)).toEqual([latest.id]);
  expect(page.hasAttachments).toBe(true);
  expect((await f.repo.latestPhoto(series.id))?.attachment).toEqual(current);
  const snapshot = await f.repo.snapshot();
  const report = await f.series.createReport(series.id, null, true);
  expect(await images(await f.vault.read(report.file))).toEqual([
    await f.vault.read(current.file),
  ]);
  expect((await f.repo.snapshot()).entries).toEqual(snapshot.entries);
  // Single reports stay scoped to the selected stand and never borrow a photo.
  const single = await f.series.createReport(series.id, latest.id, true);
  expect(await images(await f.vault.read(single.file))).toHaveLength(0);
  const compact = await f.series.createReport(series.id, null, false);
  expect(await images(await f.vault.read(compact.file))).toHaveLength(0);
  // An excluded file must not be read or prevent generation of a new report.
  await f.vault.remove(old.file);
  const updated = await f.series.createReport(series.id, null, true);
  expect(await images(await f.vault.read(updated.file))).toEqual([
    await f.vault.read(current.file),
  ]);
});

it('ignores photos in drafts and other series while still allowing saved PDF documents', async () => {
  const other = record();
  await f.series.saveRecord(other);
  const image = await photo(1);
  const otherDraft = await f.series.draft(other.id);
  otherDraft.form.episode = '1';
  otherDraft.form.attachments = [image];
  await f.series.saveEntry(otherDraft);
  await entry(1, []);
  const pending = await f.series.draft(series.id);
  pending.form.attachments = [image];
  await f.series.persistDraft(pending);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(false);
  const report = await f.series.createReport(series.id, null, true);
  expect(await images(await f.vault.read(report.file))).toHaveLength(0);
  await f.series.discard(pending);
  const document = await f.series.importAttachment(
    await sourcePdf(),
    'pdf',
    'Dokument.pdf',
  );
  const saved = await entry(2, [document]);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(true);
  await f.series.delete('entry', saved.id);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(false);
});

it.each(['single', 'history'] as const)(
  'gives the current photo a larger, centered page in a %s report',
  async (kind) => {
    await entry(1, []);
    const current = await photo(1);
    const latest = await entry(2, [current]);
    // Spy on the real PDF drawing call without replacing its implementation.
    const draw = vi.spyOn(PDFPage.prototype, 'drawImage');
    const report = await f.series.createReport(
      series.id,
      kind === 'single' ? latest.id : null,
      true,
    );
    const bytes = await f.vault.read(report.file);
    const pdf = await PDFDocument.load(bytes);
    expect(draw).toHaveBeenCalledTimes(1);
    const [image, bounds] = draw.mock.calls[0]!;
    const page = draw.mock.contexts[0] as PDFPage;
    expect(bounds!.width).toBeGreaterThan(350);
    expect(bounds!.width).toBeLessThan(370);
    expect(bounds!.height).toBeGreaterThan(350);
    expect(bounds!.width! / bounds!.height!).toBeCloseTo(
      image.width / image.height,
      5,
    );
    expect(bounds!.x! * 2 + bounds!.width!).toBeCloseTo(page.getWidth(), 5);
    expect(bounds!.y).toBeGreaterThan(60);
    expect(bounds!.y! + bounds!.height!).toBeLessThan(page.getHeight() - 100);
    expect(page.doc.getPages().indexOf(page)).toBe(1);
    // History resumes on its own page after the photo, preserving older notes.
    expect(pdf.getPageCount()).toBe(kind === 'single' ? 2 : 3);
    expect(await images(bytes)).toEqual([await f.vault.read(current.file)]);
  },
);
