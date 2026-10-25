import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, record } from '../../tests/support';
import { setLocalization, type Language } from '../../src/core/i18n/runtime';

it('creates six restorable synthetic series histories using production services', async () => {
  const root = process.env.SL_FIXTURE_OUTPUT;
  if (!root) throw Error('SL_FIXTURE_OUTPUT is required');
  for (const locale of ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'pt-BR']) {
    const copy = JSON.parse(
      await readFile(`store/${locale}/copy.json`, 'utf8'),
    );
    setLocalization({
      language: copy.language as Language,
      preference: null,
      formatLocale: locale,
    });
    const f = await fixture();
    try {
      const ids = [];
      for (let index = 0; index < 3; index++) {
        const series = record({
          name: copy.series[index],
          category: copy.genres[index],
          note: copy.seriesNote,
          reminder:
            index === 0
              ? {
                  interval: 'daily',
                  day: 1,
                  month: 1,
                  hour: 20,
                  minute: 15,
                  deliveryMode: 'normal',
                  startsAtMillis: Date.parse('2026-10-01T18:15:00Z'),
                }
              : null,
          createdAt: '2026-10-01T18:00:00.000Z',
          updatedAt: '2026-10-20T18:00:00.000Z',
        });
        await f.series.saveRecord(series);
        const entries = [];
        for (const [i, episode] of [1, 3, 5].entries()) {
          const draft = await f.series.draft(series.id);
          draft.form.season = String(index + 1);
          draft.form.episode = String(episode);
          draft.form.occurredAt = `2026-10-${String(15 + i * 2).padStart(2, '0')}T18:15:00.000Z`;
          draft.form.note = copy.note;
          if (index === 0 && i === 2) {
            const photo = await f.series.importAttachment(
              new Uint8Array(
                execFileSync('convert', [
                  'assets/photo-examples/01_tv_staffel_1_folge_5.png',
                  'jpg:-',
                ]),
              ),
              'photo',
              'Series-night.jpg',
            );
            draft.form.attachments = [photo];
          }
          entries.push((await f.series.saveEntry(draft)).entry);
        }
        ids.push({ recordId: series.id, entryId: entries.at(-1)!.id });
      }
      const backup = await f.backup.create('Demo2026');
      const decoded = await f.backup.codec.decode(backup, 'Demo2026');
      expect(decoded.data.records).toHaveLength(3);
      expect(decoded.data.entries).toHaveLength(9);
      expect(decoded.data.entries.some((e) => e.attachments.length === 1)).toBe(
        true,
      );
      const destination = join(root, locale);
      await mkdir(destination, { recursive: true });
      await writeFile(join(destination, 'Demo.slbackup'), backup);
      await writeFile(
        join(destination, 'fixture.json'),
        JSON.stringify({ locale, series: ids, password: 'Demo2026' }, null, 2) +
          '\n',
      );
    } finally {
      await f.close();
    }
  }
});
