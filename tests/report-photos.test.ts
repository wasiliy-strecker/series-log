import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
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

it('never falls back to older photos in a PDF and keeps the dashboard cover independent', async () => {
  const old = await photo(1);
  await entry(1, [old]);
  await entry(2, []);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(false);
  expect((await f.repo.dashboard())[0]!.photo?.attachment).toEqual(old);
  const report = await f.series.createReport(series.id, null, true);
  expect(await images(await f.vault.read(report.file))).toHaveLength(0);
  // An excluded file must not be read or prevent generation of a new report.
  await f.vault.remove(old.file);
  await expect(
    f.series.createReport(series.id, null, true),
  ).resolves.toBeDefined();
  const current = await photo(2);
  await entry(3, [current]);
  expect((await f.repo.entries(series.id)).hasAttachments).toBe(true);
  const updated = await f.series.createReport(series.id, null, true);
  expect(await images(await f.vault.read(updated.file))).toEqual([
    await f.vault.read(current.file),
  ]);
});
