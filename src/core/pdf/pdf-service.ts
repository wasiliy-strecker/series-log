import {
  t,
  localization,
  translator,
  type Localization,
} from '../i18n/runtime';
import { positionText } from '../domain/episode-position';
import { PDFDocument, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  type Attachment,
  type EpisodeEntry,
  type SeriesRecord,
} from '../domain/models';
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
    throw new ContentLimitError(
      t('Die PDF überschreitet die Grenze von 50 MB.'),
    );
  if (bytes.length < 20)
    throw new Error(t('Die PDF ist leer oder beschädigt.'));
  const head = String.fromCharCode(...bytes.slice(0, 8));
  const tail = String.fromCharCode(...bytes.slice(-2048));
  if (!head.startsWith('%PDF-') || !tail.includes('%%EOF'))
    throw new Error(t('Die PDF ist beschädigt oder unvollständig.'));
  try {
    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
      updateMetadata: false,
    });
    if (pdf.isEncrypted) throw new Error('encrypted PDF');
    checkPdfPages(pdf.getPageCount());
    if (!pdf.getPageCount()) throw new Error(t('Die PDF hat keine Seiten.'));
    for (const page of pdf.getPages()) {
      if (
        !Number.isFinite(page.getWidth()) ||
        !Number.isFinite(page.getHeight()) ||
        page.getWidth() <= 0 ||
        page.getHeight() <= 0
      )
        throw new Error(t('Ungültiges Seitenformat.'));
    }
    return pdf;
  } catch (error) {
    if (error instanceof ContentLimitError) throw error;
    if (
      String(error).toLowerCase().includes('encrypt') ||
      String(error).includes(t('Passwort'))
    )
      throw new Error(
        t(
          'Diese PDF ist passwortgeschützt. Bitte eine ungeschützte Kopie verwenden.',
        ),
      );
    throw new Error(
      t('Die PDF ist beschädigt oder enthält keine lesbaren Seiten.'),
    );
  }
}
export type ReportFontBytes = {
  regular: Uint8Array;
  bold: Uint8Array;
};
export type ReportOptions = {
  locale?: Localization;
  kind: 'single' | 'history';
  createdAt: string;
};
function renderer(locale: Localization) {
  const t = translator(locale);
  function dateTime(iso: string, withOffset = false) {
    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, '0');
    const text = date.toLocaleString(locale.formatLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (!withOffset) return text;
    const offset = -date.getTimezoneOffset();
    return `${text} (UTC${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)})`;
  }
  function summary(entry: EpisodeEntry) {
    return positionText(entry, locale);
  }
  function recordSection(layout: ReportLayout, record: SeriesRecord) {
    const rows = [
      [t('Serie'), record.name],
      [t('Genre'), record.category],
    ];
    layout.ensure(80);
    layout.text(t('Aktuelle Serienangaben'), { bold: true });
    layout.gap(6);
    layout.dataTable(rows);
    if (record.note.trim()) {
      layout.ensure(45);
      layout.gap(10);
      layout.text(t('Notiz zur Serie'), { bold: true });
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
    layout.text(t('Serienprotokoll'), { size: 24, bold: true });
    layout.gap(4);
    layout.text(
      options.kind === 'single'
        ? t('Einzelner Folgenstand')
        : t('Serienverlauf'),
      { size: 14, color: REPORT_GREY },
    );
    layout.gap(6);
    layout.text(
      t('PDF erstellt am {p0} · {p1}', {
        p0: dateTime(options.createdAt),
        p1: full ? t('Mit Foto') : t('Ohne Foto'),
      }),
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
    history: boolean,
    full: boolean,
  ) {
    const rows = [
      [t('Folgenstand'), positionText(entry, locale)],
      [t('Gesehen am'), dateTime(entry.occurredAt, true)],
    ];
    // Keep the entry heading and fields together whenever they fit.
    layout.ensure(
      (history ? 18 : 0) + (17 * 2400) / 2048 + 8 + layout.dataHeight(rows),
    );
    if (history) layout.gap(18);
    layout.text(t('Eintrag {p0}', { p0: number }), {
      size: 17,
      bold: true,
      color: REPORT_ACCENT,
    });
    layout.gap(8);
    layout.dataTable(rows);
    const photos = entry.attachments.filter((a) => a.kind === 'photo');
    if (!full && photos.length) {
      layout.ensure(40);
      layout.gap(10);
      layout.text(t('Fotos: {p0} (nicht eingebettet)', { p0: photos.length }), {
        size: 10,
        color: REPORT_GREY,
      });
    }
    const documents = entry.attachments.filter((a) => a.kind === 'pdf');
    if (documents.length) {
      layout.ensure(45);
      layout.gap(10);
      layout.text(t('PDF-Dokumente'), { bold: true });
      for (const document of documents)
        layout.text(
          `${document.name} · ${document.pages} ${document.pages === 1 ? t('Seite') : t('Seiten')}`,
        );
    }
    if (entry.note.trim()) {
      layout.ensure(45);
      layout.gap(10);
      layout.text(t('Notiz'), { bold: true });
      layout.gap(4);
      layout.text(entry.note);
    }
  }
  class LocalizedPdfService {
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
      const cover = new ReportLayout(pdf, fonts, undefined, true, locale);
      cover.text(t('SERIENLOG'), { size: 24, bold: true });
      cover.gap(24);
      cover.text(record.name, { size: 20 });
      cover.gap(16);
      cover.text(
        t('Serienprotokoll – Teil {p0} von {p1}', { p0: index, p1: total }),
        { size: 18 },
      );
      cover.gap(16);
      cover.text(t('Erstellt am {p0}', { p0: dateTime(createdAt) }));
      cover.gap(24);
      cover.text(
        t(
          'Dieser Teil gehört zu einem zusammenhängenden Protokoll. Bitte alle {p0} Teile gemeinsam aufbewahren.',
          { p0: total },
        ),
      );
      if (index > 1) {
        cover.gap(12);
        cover.text(
          t(
            'Fortsetzung aus Teil {p0}. Einträge oder Dokumente können über die Teilgrenze hinweg fortgesetzt werden.',
            { p0: index - 1 },
          ),
        );
      }
      pdf.setTitle(
        t('Serienprotokoll · {p0} · Teil {p1} von {p2}', {
          p0: record.name,
          p1: index,
          p2: total,
        }),
      );
      pdf.setAuthor(t('SerienLog'));
      pdf.setCreationDate(new Date(createdAt));
    }
    async create(
      record: SeriesRecord,
      entries: EpisodeEntry[],
      full: boolean,
      options: ReportOptions,
    ): Promise<Uint8Array> {
      const sorted = [...entries].sort(
        (a, b) =>
          Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
          b.id.localeCompare(a.id),
      );
      const photoEntry = sorted.find((entry) =>
        entry.attachments.some((a) => a.kind === 'photo'),
      );
      const ordered = sorted.map((entry) => {
        const photo =
          options.kind === 'single' || entry.id === photoEntry?.id
            ? entry.attachments.find((a) => a.kind === 'photo')
            : undefined;
        return {
          ...entry,
          attachments: entry.attachments.filter(
            (a) => a.kind === 'pdf' || a === photo,
          ),
        };
      });
      if (
        ordered.reduce(
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
          t(
            'Die Anhänge dieses Protokolls überschreiten 64 MB. Bitte Einzelprotokolle erstellen.',
          ),
        );
      const pdf = await PDFDocument.create();
      pdf.setTitle(t('Serienprotokoll · {p0}', { p0: record.name }));
      pdf.setAuthor(t('SerienLog'));
      pdf.setSubject(
        options.kind === 'single'
          ? t('Private Dokumentation eines Eintrags')
          : t('Private Dokumentation des Serienverlaufs'),
      );
      pdf.setProducer(t('SerienLog · lokale Verarbeitung'));
      pdf.setCreationDate(new Date(options.createdAt));
      pdf.registerFontkit(fontkit);
      const bytes = await this.fontBytes();
      const fonts: ReportFonts = {
        regular: await pdf.embedFont(bytes.regular, { subset: true }),
        bold: await pdf.embedFont(bytes.bold, { subset: true }),
      };
      const withDocuments =
        full &&
        ordered.some((entry) =>
          entry.attachments.some((a) => a.kind === 'pdf'),
        );
      const section = (number?: number) => {
        const layout = new ReportLayout(pdf, fonts, number, false, locale);
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
            ]),
          );
        else layout!.text(t('Noch keine Einträge vorhanden.'));
        if (withDocuments) {
          layout!.finish();
          layout = undefined;
        }
      }
      for (const [index, entry] of ordered.entries()) {
        const number = options.kind === 'single' ? 1 : ordered.length - index;
        const photos: {
          attachment: Attachment;
          image: PDFImage;
        }[] = [];
        // Verify included references, also for compact output. Excluded older
        // photos must neither be read nor block a new report.
        for (const attachment of entry.attachments) {
          const content = await verifiedFile(this.vault, attachment);
          if (attachment.kind === 'pdf') {
            const original = await inspectPdf(content);
            if (original.getPageCount() !== attachment.pages)
              throw new Error(
                t('Die Seitenzahl eines PDF-Anhangs stimmt nicht mehr.'),
              );
          } else {
            // Validate compact photos in a temporary document so their binary
            // data is not embedded as unused objects in the compact report.
            const image = await (
              full ? pdf : await PDFDocument.create()
            ).embedJpg(content);
            if (full) photos.push({ attachment, image });
          }
        }
        const current = layout ?? section(number);
        const hasDetails = entry.note.trim() || entry.attachments.length;
        if (options.kind === 'single' || withDocuments || hasDetails)
          entrySection(
            current,
            entry,
            number,
            options.kind === 'history',
            full,
          );
        for (const [photoIndex, { attachment, image }] of photos.entries())
          current.photo(image, {
            title: t('Eintrag {p0} · {p1}', {
              p0: number,
              p1: summary(entry),
            }),
            name: attachment.name,
            number: photoIndex + 1,
            total: photos.length,
          });
        if (withDocuments) {
          current.finish();
          for (const attachment of entry.attachments.filter(
            (a) => a.kind === 'pdf',
          )) {
            const original = await inspectPdf(
              await verifiedFile(this.vault, attachment),
            );
            const divider = new ReportLayout(
              pdf,
              fonts,
              undefined,
              true,
              locale,
            );
            divider.text(t('SERIENLOG'), { bold: true, color: REPORT_ACCENT });
            divider.gap(40);
            divider.text(t('Dokument zu Eintrag {p0}', { p0: number }), {
              size: 22,
              bold: true,
            });
            divider.gap(12);
            divider.text(dateTime(entry.occurredAt, true));
            divider.gap(24);
            divider.text(attachment.name, { size: 16, bold: true });
            divider.gap(12);
            divider.text(
              t(
                '{p0} Dokumentseiten folgen. Die Originaldatei bleibt separat in der SerienLog gespeichert.',
                { p0: original.getPageCount() },
              ),
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
          t(
            'Das Protokoll überschreitet 50 MB. Bitte kleinere Einzelprotokolle erstellen.',
          ),
        );
      return result;
    }
  }

  return LocalizedPdfService;
}
export class PdfService {
  constructor(
    private vault: FileVault,
    private fontBytes: () => Promise<ReportFontBytes>,
  ) {}
  create(
    record: SeriesRecord,
    entries: EpisodeEntry[],
    full: boolean,
    options: ReportOptions,
  ) {
    const Renderer = renderer(options.locale ?? localization());
    return new Renderer(this.vault, this.fontBytes).create(
      record,
      entries,
      full,
      options,
    );
  }
  addPartCover(
    pdf: PDFDocument,
    record: SeriesRecord,
    index: number,
    total: number,
    createdAt: string,
    locale = localization(),
  ) {
    const Renderer = renderer(locale);
    return new Renderer(this.vault, this.fontBytes).addPartCover(
      pdf,
      record,
      index,
      total,
      createdAt,
    );
  }
}
