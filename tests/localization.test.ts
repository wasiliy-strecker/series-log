import { positiveInteger } from '../src/core/i18n/numbers';
import { afterEach, expect, it } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  localizedErrorText,
  catalogs,
  languages,
  localization,
  resolveLanguage,
  setLocalization,
  t,
  formatNumber,
} from '../src/core/i18n/runtime';
import { parseDateInput } from '../src/core/ui/date-time-model';
import { positionText } from '../src/core/domain/episode-position';
import { reminderTime } from '../src/features/records/presentation-model';
import { fixture, record } from './support';

const german = {
  language: 'de',
  formatLocale: 'de-DE',
  preference: null,
} as const;
afterEach(() => setLocalization(german));
it('resolves the first supported system language with an independent region', () => {
  expect(resolveLanguage(null, ['sv-SE', 'fr-CA', 'de-DE'])).toBe('fr');
  expect(resolveLanguage('it', ['de-DE'])).toBe('it');
  expect(resolveLanguage(null, ['pt-PT'])).toBe('pt');
  expect(resolveLanguage(null, ['ja-JP'])).toBe('en');
  for (const language of languages) {
    setLocalization({ language, formatLocale: 'de-DE', preference: language });
    expect(localization().formatLocale).toBe('de-DE');
    expect(t('SerienLog')).toBeTruthy();
    expect(positionText({ season: 2, episode: 7 })).not.toContain('{p');
    for (const key of Object.keys(
      catalogs.de,
    ) as (keyof typeof catalogs.de)[]) {
      expect(Object.keys(catalogs[language])).toContain(key);
      expect(catalogs[language][key].match(/\{\w+\}/g)?.sort() ?? []).toEqual(
        catalogs.de[key].match(/\{\w+\}/g)?.sort() ?? [],
      );
    }
  }
});
it('parses device-region dates independently of app language and rejects impossible dates', () => {
  const first = new Date(2000, 0, 1),
    last = new Date(2100, 11, 31);
  setLocalization({ language: 'en', preference: 'en', formatLocale: 'de-DE' });
  expect(parseDateInput('25.10.2026', first, last)).toEqual(
    new Date(2026, 9, 25),
  );
  expect(parseDateInput('31.02.2026', first, last)).toBeNull();
  setLocalization({ language: 'de', preference: 'de', formatLocale: 'en-US' });
  expect(parseDateInput('10/25/2026', first, last)).toEqual(
    new Date(2026, 9, 25),
  );
  expect(parseDateInput('25/10/2026', first, last)).toBeNull();
});
it('changes derived search without changing records, drafts or legacy backup data', async () => {
  const f = await fixture();
  try {
    const r = record({
      name: 'Eigener Titel',
      category: 'Mein Genre',
      note: 'Eigene Notiz',
    });
    await f.series.saveRecord(r);
    const draft = await f.series.draft(r.id);
    draft.form.season = '2';
    draft.form.episode = '7';
    await f.series.saveEntry(draft);
    const open = await f.series.draft(r.id);
    open.form.note = 'Noch nicht gespeichert';
    await f.repo.saveDraft(open);
    const before = await f.repo.snapshot(),
      drafts = await f.repo.drafts();
    setLocalization({
      language: 'fr',
      preference: 'fr',
      formatLocale: 'en-US',
    });
    await f.repo.reindexSearch();
    expect(await f.repo.snapshot()).toEqual(before);
    expect(await f.repo.drafts()).toEqual(drafts);
    expect(f.raw.prepare('SELECT search FROM entries').get()!.search).toContain(
      'saison 2',
    );
    const legacy = new Uint8Array(
      await readFile('tests/fixtures/backup-v1.bin'),
    );
    const decoded = await f.backup.codec.decode(
      legacy,
      'Synthetic SerienLog ä🔑',
    );
    const expected = JSON.parse(
      await readFile('tests/fixtures/backup-v1.json', 'utf8'),
    );
    expect(decoded.data).toEqual(expected.data ?? expected);
  } finally {
    await f.close();
  }
});
it('writes real PDF text in all six languages and freezes language across awaits', async () => {
  const f = await fixture();
  try {
    const r = record();
    await f.series.saveRecord(r);
    const draft = await f.series.draft(r.id);
    draft.form.season = '1';
    draft.form.episode = '5';
    const { entry } = await f.series.saveEntry(draft);
    for (const language of languages) {
      setLocalization({
        language,
        preference: language,
        formatLocale: 'de-DE',
      });
      const pending = f.pdf.create(r, [entry], false, {
        kind: 'history',
        createdAt: '2026-10-25T12:00:00.000Z',
      });
      setLocalization({
        language: language === 'en' ? 'fr' : 'en',
        preference: null,
        formatLocale: 'en-US',
      });
      const file = join(f.root, language + '.pdf');
      await writeFile(file, await pending);
      const text = execFileSync('pdftotext', ['-layout', file, '-'], {
        encoding: 'utf8',
      });
      expect(text).toContain(catalogs[language]['Serienprotokoll']);
      expect(text).toContain(catalogs[language]['SERIENLOG']);
      expect(text).toContain(catalogs[language]['Nr.']);
      expect(text).toContain('25.10.2026');
      expect(text).not.toContain('{p0}');
    }
  } finally {
    await f.close();
  }
});

it('validates regional whole numbers without reinterpreting decimal separators', () => {
  expect(positiveInteger('1.234', 'de-DE')).toBe(1234);
  expect(positiveInteger('1,234', 'en-US')).toBe(1234);
  expect(positiveInteger('1,234', 'de-DE')).toBeNull();
  expect(positiveInteger('1.234', 'en-US')).toBeNull();
  expect(positiveInteger('12,34', 'en-US')).toBeNull();
  expect(positiveInteger('١٢٣', 'ar-EG')).toBe(123);
  for (const value of ['0', '-1', '1e3', '9007199254740993'])
    expect(positiveInteger(value)).toBeNull();
});

it('formats numeric labels with the device region independently of language', () => {
  setLocalization({ language: 'en', preference: 'en', formatLocale: 'de-DE' });
  expect(formatNumber(1234.5)).toBe('1.234,5');
  expect(t('Foto {p0}', { p0: 1234 })).toBe('Photo 1.234');
  expect(reminderTime({ hour: 20, minute: 15 })).toBe('20:15');
  setLocalization({ language: 'de', preference: 'de', formatLocale: 'en-US' });
  expect(formatNumber(1234.5)).toBe('1,234.5');
  expect(t('Foto {p0}', { p0: 1234 })).toBe('Foto 1,234');
  expect(reminderTime({ hour: 20, minute: 15 })).toMatch(/08:15\s?PM/);
});

it('localizes known native failures and safely presents unknown vendor errors', () => {
  setLocalization({ language: 'fr', preference: 'fr', formatLocale: 'de-DE' });
  expect(
    localizedErrorText('Die Datei fehlt oder ihre Prüfsumme ist ungültig.'),
  ).toBe(catalogs.fr['Die Datei fehlt oder ihre Prüfsumme ist ungültig.']);
  expect(
    localizedErrorText(
      'Call to function rejected: Die PDF enthält keine Seiten.',
    ),
  ).toBe(catalogs.fr['Die PDF enthält keine Seiten.']);
  expect(localizedErrorText('Internal vendor exception SQLITE_999')).toBe(
    catalogs.fr[
      'Die Aktion konnte nicht abgeschlossen werden. Deine gespeicherten Daten bleiben erhalten.'
    ],
  );
});
