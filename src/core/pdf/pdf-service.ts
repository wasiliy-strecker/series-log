import { episodeDelta, positionText } from '../domain/progress';
import { PDFDocument, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { type EpisodeEntry, type SeriesRecord } from '../domain/models';
import {
  ReportLayout,
  REPORT_ACCENT,
  REPORT_GREY,
  type ReportFonts,
} from './report-layout';
import type { FileVault } from '../ports';
import { verifiedFile } from '../files/integrity';
import {
  ContentLimitError,
  MAX_FILE_BYTES,
  checkPdfPages,
} from '../files/limits';

export { MAX_FILE_BYTES } from '../files/limits';
export async function inspectPdf(bytes: Uint8Array): Promise<PDFDocument> {
  if (bytes.length > MAX_FILE_BYTES)
    throw new ContentLimitError('Die PDF überschreitet die Grenze von 50 MB.');
  if (bytes.length < 20) throw new Error('Die PDF ist leer oder beschädigt.');
  const head = String.fromCharCode(...bytes.slice(0, 8));
  const tail = String.fromCharCode(...bytes.slice(-2048));
  if (!head.startsWith('%PDF-') || !tail.includes('%%EOF'))
    throw new Error('Die PDF ist beschädigt oder unvollständig.');
  try {
    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
      updateMetadata: false,
    });
    if (pdf.isEncrypted)
      throw new Error('Passwortgeschützte PDFs werden nicht unterstützt.');
    checkPdfPages(pdf.getPageCount());
    if (!pdf.getPageCount()) throw new Error('Die PDF hat keine Seiten.');
    for (const page of pdf.getPages()) {
      if (
        !Number.isFinite(page.getWidth()) ||
        !Number.isFinite(page.getHeight()) ||
        page.getWidth() <= 0 ||
        page.getHeight() <= 0
      )
        throw new Error('Ungültiges Seitenformat.');
    }
    return pdf;
  } catch (error) {
    if (error instanceof ContentLimitError) throw error;
    if (
      String(error).toLowerCase().includes('encrypt') ||
      String(error).includes('Passwort')
    )
      throw new Error(
        'Diese PDF ist passwortgeschützt. Bitte eine ungeschützte Kopie verwenden.',
      );
    throw new Error(
      'Die PDF ist beschädigt oder enthält keine lesbaren Seiten.',
    );
  }
}
export type ReportFontBytes = { regular: Uint8Array; bold: Uint8Array };
export type ReportOptions = {
  kind: 'single' | 'history';
  createdAt: string;
};

function dateTime(iso: string, withOffset = false) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  const text = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (!withOffset) return text;
  const offset = -date.getTimezoneOffset();
  return `${text} (UTC${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)})`;
}
function summary(entry: EpisodeEntry) {
  return positionText(entry);
}
function difference(
  record: SeriesRecord,
  entry: EpisodeEntry,
  previous?: EpisodeEntry,
) {
  if (!previous) return '–';
  const delta = episodeDelta(record, entry, previous);
  return delta === null
    ? 'Staffellänge offen'
    : `${delta > 0 ? '+' : ''}${delta} Folgen`;
}
function recordSection(layout: ReportLayout, record: SeriesRecord) {
  const rows = [
    ['Serie', record.name],
    ['Genre', record.category],
    ['Gesamtfolgen', record.totalEpisodes?.toString() ?? 'Offen'],
    ...record.seasons.flatMap((length, i) =>
      length === null ? [] : [[`Staffel ${i + 1}`, `${length} Folgen`]],
    ),
  ];
  layout.ensure(80);
  layout.text('Aktuelle Serienangaben', { bold: true });
  layout.gap(6);
  layout.dataTable(rows);
  if (record.note.trim()) {
    layout.ensure(45);
    layout.gap(10);
    layout.text('Notiz zur Serie', { bold: true });
    layout.gap(4);
    layout.text(record.note);
  }
}
function reportHeading(
  layout: ReportLayout,
  record: SeriesRecord,
  full: boolean,
  options: ReportOptions,
) {
  layout.gap(16);
  layout.text('Serienprotokoll', { size: 24, bold: true });
  layout.gap(4);
  layout.text(
    options.kind === 'single' ? 'Einzelner Folgenstand' : 'Serienverlauf',
    { size: 14, color: REPORT_GREY },
  );
  layout.gap(6);
  layout.text(
    `PDF erstellt am ${dateTime(options.createdAt)} · ${full ? 'Mit Fotos' : 'Kompakt ohne Anhänge'}`,
    { size: 9, color: REPORT_GREY },
  );
  layout.gap(18);
  recordSection(layout, record);
  layout.gap(18);
}
function entrySection(
  layout: ReportLayout,
  entry: EpisodeEntry,
  number: number,
  images: PDFImage[],
  history: boolean,
  full: boolean,
) {
  const rows = [
    ['Folgenstand', positionText(entry)],
    ['Gesehen am', dateTime(entry.occurredAt, true)],
  ];
  // Keep heading, fields and the first photo pair together whenever they fit.
  layout.ensure(
    (history ? 18 : 0) +
      (17 * 2400) / 2048 +
      8 +
      layout.dataHeight(rows) +
      (images.length ? 10 + layout.photoRowHeight() : 0),
  );
  if (history) layout.gap(18);
  layout.text(`Eintrag ${number}`, {
    size: 17,
    bold: true,
    color: REPORT_ACCENT,
  });
  layout.gap(8);
  layout.dataTable(rows);
  if (images.length) {
    layout.gap(10);
    layout.photos(images, 0);
    for (let start = 2; start < images.length; start += 2) {
      const caption = `Eintrag ${number} · ${summary(entry)} · ${dateTime(entry.occurredAt, true)}`;
      layout.ensure(
        12 + layout.textHeight(caption, 10) + 6 + layout.photoRowHeight(),
      );
      layout.gap(12);
      layout.text(caption, { size: 10 });
      layout.gap(6);
      layout.photos(images, start);
    }
  }
  const photos = entry.attachments.filter((a) => a.kind === 'photo');
  if (!full && photos.length) {
    layout.ensure(40);
    layout.gap(10);
    layout.text(`Fotos: ${photos.length} (nicht eingebettet)`, {
      size: 10,
      color: REPORT_GREY,
    });
  }
  const documents = entry.attachments.filter((a) => a.kind === 'pdf');
  if (documents.length) {
    layout.ensure(45);
    layout.gap(10);
    layout.text('PDF-Dokumente', { bold: true });
    for (const document of documents)
      layout.text(
        `${document.name} · ${document.pages} ${document.pages === 1 ? 'Seite' : 'Seiten'}`,
      );
  }
  if (entry.note.trim()) {
    layout.ensure(45);
    layout.gap(10);
    layout.text('Notiz', { bold: true });
    layout.gap(4);
    layout.text(entry.note);
  }
}

export class PdfService {
  constructor(
    private vault: FileVault,
    private fontBytes: () => Promise<ReportFontBytes>,
  ) {}

  async addPartCover(
    pdf: PDFDocument,
    record: SeriesRecord,
    index: number,
    total: number,
    createdAt: string,
  ) {
    pdf.registerFontkit(fontkit);
    const bytes = await this.fontBytes();
    const fonts = {
      regular: await pdf.embedFont(bytes.regular, { subset: true }),
      bold: await pdf.embedFont(bytes.bold, { subset: true }),
    };
    const cover = new ReportLayout(pdf, fonts, undefined, true);
    cover.text('SERIENLOG', { size: 24, bold: true });
    cover.gap(24);
    cover.text(record.name, { size: 20 });
    cover.gap(16);
    cover.text(`Serienprotokoll – Teil ${index} von ${total}`, { size: 18 });
    cover.gap(16);
    cover.text(`Erstellt am ${dateTime(createdAt)}`);
    cover.gap(24);
    cover.text(
      `Dieser Teil gehört zu einem zusammenhängenden Protokoll. Bitte alle ${total} Teile gemeinsam aufbewahren.`,
    );
    if (index > 1) {
      cover.gap(12);
      cover.text(
        `Fortsetzung aus Teil ${index - 1}. Einträge oder Dokumente können über die Teilgrenze hinweg fortgesetzt werden.`,
      );
    }
    pdf.setTitle(
      `Serienprotokoll · ${record.name} · Teil ${index} von ${total}`,
    );
    pdf.setAuthor('SerienLog');
    pdf.setCreationDate(new Date(createdAt));
  }

  async create(
    record: SeriesRecord,
    entries: EpisodeEntry[],
    full: boolean,
    options: ReportOptions,
  ): Promise<Uint8Array> {
    if (
      entries.reduce(
        (sum, entry) =>
          sum +
          entry.attachments.reduce(
            (bytes, attachment) => bytes + attachment.size,
            0,
          ),
        0,
      ) >
      64 * 1024 * 1024
    )
      throw new Error(
        'Die Anhänge dieses Protokolls überschreiten 64 MB. Bitte Einzelprotokolle erstellen.',
      );
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Serienprotokoll · ${record.name}`);
    pdf.setAuthor('SerienLog');
    pdf.setSubject(
      options.kind === 'single'
        ? 'Private Dokumentation eines Eintrags'
        : 'Private Dokumentation des Serienverlaufs',
    );
    pdf.setProducer('SerienLog · lokale Verarbeitung');
    pdf.setCreationDate(new Date(options.createdAt));
    pdf.registerFontkit(fontkit);
    const bytes = await this.fontBytes();
    const fonts: ReportFonts = {
      regular: await pdf.embedFont(bytes.regular, { subset: true }),
      bold: await pdf.embedFont(bytes.bold, { subset: true }),
    };
    const ordered = [...entries].sort(
      (a, b) =>
        Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
        b.id.localeCompare(a.id),
    );
    const withDocuments =
      full &&
      ordered.some((entry) => entry.attachments.some((a) => a.kind === 'pdf'));
    const section = (number?: number) => {
      const layout = new ReportLayout(pdf, fonts, number);
      reportHeading(layout, record, full, options);
      return layout;
    };
    let layout =
      options.kind === 'history' || !withDocuments ? section() : undefined;
    if (options.kind === 'history') {
      if (ordered.length)
        layout!.historyTable(
          ordered.map((entry, i) => [
            String(ordered.length - i),
            dateTime(entry.occurredAt, true),
            summary(entry),
            difference(record, entry, ordered[i + 1]),
          ]),
        );
      else layout!.text('Noch keine Einträge vorhanden.');
      if (withDocuments) {
        layout!.finish();
        layout = undefined;
      }
    }
    for (const [index, entry] of ordered.entries()) {
      const number = options.kind === 'single' ? 1 : ordered.length - index;
      const images: PDFImage[] = [];
      // Verify every reference, also for compact output. A broken file must fail
      // the whole report before SeriesService persists a completed report.
      for (const attachment of entry.attachments) {
        const content = await verifiedFile(this.vault, attachment);
        if (attachment.kind === 'pdf') {
          const original = await inspectPdf(content);
          if (original.getPageCount() !== attachment.pages)
            throw new Error(
              'Die Seitenzahl eines PDF-Anhangs stimmt nicht mehr.',
            );
        } else {
          // Validate compact photos in a temporary document so their binary
          // data is not embedded as unused objects in the compact report.
          const image = await (
            full ? pdf : await PDFDocument.create()
          ).embedJpg(content);
          if (full) images.push(image);
        }
      }
      const current = layout ?? section(number);
      const hasDetails = entry.note.trim() || entry.attachments.length;
      if (options.kind === 'single' || withDocuments || hasDetails)
        entrySection(
          current,
          entry,
          number,
          images,
          options.kind === 'history',
          full,
        );
      if (withDocuments) {
        current.finish();
        for (const attachment of entry.attachments.filter(
          (a) => a.kind === 'pdf',
        )) {
          const original = await inspectPdf(
            await verifiedFile(this.vault, attachment),
          );
          const divider = new ReportLayout(pdf, fonts, undefined, true);
          divider.text('SERIENLOG', { bold: true, color: REPORT_ACCENT });
          divider.gap(40);
          divider.text(`Dokument zu Eintrag ${number}`, {
            size: 22,
            bold: true,
          });
          divider.gap(12);
          divider.text(dateTime(entry.occurredAt, true));
          divider.gap(24);
          divider.text(attachment.name, { size: 16, bold: true });
          divider.gap(12);
          divider.text(
            `${original.getPageCount()} Dokumentseiten folgen. Die Originaldatei bleibt separat in der SerienLog gespeichert.`,
          );
          // Copy original PDF pages, preserving searchable text, rotation and size.
          checkPdfPages(pdf.getPageCount() + original.getPageCount(), true);
          const copied = await pdf.copyPages(
            original,
            original.getPageIndices(),
          );
          copied.forEach((page) => pdf.addPage(page));
        }
      }
    }
    layout?.finish();
    checkPdfPages(pdf.getPageCount(), true);
    const result = await pdf.save();
    if (result.length > MAX_FILE_BYTES)
      throw new Error(
        'Das Protokoll überschreitet 50 MB. Bitte kleinere Einzelprotokolle erstellen.',
      );
    return result;
  }
}
