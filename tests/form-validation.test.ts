import { expect, it } from 'vitest';
import type { EntryForm } from '../src/core/domain/models';
import { record } from './support';
import {
  recordSaveFieldErrors,
  validateRecordForm,
} from '../src/features/records/record-form-validation';
import {
  entrySaveFieldErrors,
  needsLowerPositionConfirmation,
  validateEntryForm,
} from '../src/features/entries/entry-form-validation';

function entry(overrides: Partial<EntryForm> = {}): EntryForm {
  return {
    season: '1',
    episode: '2',
    occurredAt: '2026-10-13T20:00:00.000Z',
    note: '',
    attachments: [],
    ...overrides,
  };
}

it('places missing series fields and invalid episode counts on their inputs', () => {
  const missing = validateRecordForm(record({ name: '', category: ' ' }), '');
  expect(missing.value).toBeNull();
  expect(missing.errors).toMatchObject({
    category: 'Bitte ein Genre eingeben.',
    name: 'Bitte einen Serientitel eingeben.',
  });

  const invalid = validateRecordForm(record(), 'x');
  expect(invalid.errors.totalEpisodes).toContain('ganze Zahl');
  const total = validateRecordForm(record({ seasons: [8] }), '5');
  expect(total.errors.totalEpisodes).toContain('Gesamtfolgenzahl');
});

it('keeps stored season lengths when saving the simplified series form', () => {
  const original = record({ seasons: [8, null, 10], totalEpisodes: 26 });
  const updated = validateRecordForm(
    { ...original, name: 'Neuer Titel' },
    '30',
  );
  expect(updated.value).toMatchObject({
    name: 'Neuer Titel',
    totalEpisodes: 30,
    seasons: [8, null, 10],
  });
  expect(validateRecordForm(original, '').value).toMatchObject({
    totalEpisodes: null,
    seasons: [8, null, 10],
  });
  expect(original.seasons).toEqual([8, null, 10]);
});

it('places missing episode and date values and progress conflicts on their inputs', () => {
  const missing = validateEntryForm(
    entry({ episode: '', occurredAt: '' }),
    record(),
  );
  expect(missing.position).toBeNull();
  expect(missing.errors.episode).toContain('Folgenzahl');
  expect(missing.errors.occurredAt).toContain('Datum');

  const overSeason = validateEntryForm(
    entry({ episode: '9' }),
    record({ seasons: [8] }),
  );
  expect(overSeason.errors.episode).toContain('Staffel 1 hat 8 Folgen');
  expect(validateEntryForm(entry(), record()).position).toEqual({
    season: 1,
    episode: 2,
  });
});

it('maps progress errors found during save back to the affected field', () => {
  expect(
    recordSaveFieldErrors(
      new Error(
        'Staffel 2 hat 6 Folgen. Ein gespeicherter Folgenstand darf diese Zahl nicht überschreiten.',
      ),
    ),
  ).toBeNull();
  expect(
    recordSaveFieldErrors(
      new Error('Der Folgenstand überschreitet die Gesamtfolgenzahl.'),
    ),
  ).toHaveProperty('totalEpisodes');
  expect(
    entrySaveFieldErrors(
      new Error(
        'Staffel 1 hat 8 Folgen. Ein gespeicherter Folgenstand darf diese Zahl nicht überschreiten.',
      ),
    ),
  ).toHaveProperty('episode');
});

it('explains the entered stand and configured total without silently raising the limit', () => {
  const form = entry({ episode: '59' });
  const series = record({ totalEpisodes: 26 });
  const result = validateEntryForm(form, series);
  expect(result.position).toBeNull();
  expect(result.errors.episode).toContain('Gesamtfolgenzahl von 26 Folgen');
  expect(result.errors.episode).toContain('59 gesehenen Folgen');
  expect(series.totalEpisodes).toBe(26);
  expect(
    validateEntryForm(form, { ...series, totalEpisodes: 80 }).position,
  ).toEqual({ season: 1, episode: 59 });
  expect(
    validateEntryForm(form, { ...series, totalEpisodes: null }).position,
  ).toEqual({ season: 1, episode: 59 });
});

it('warns about a lower latest stand but allows older history entries without a warning', () => {
  const latest = {
    id: '11111111-1111-4111-8111-111111111111',
    recordId: '22222222-2222-4222-8222-222222222222',
    season: 1,
    episode: 6,
    occurredAt: '2026-10-13T20:00:00.000Z',
    note: '',
    attachments: [],
    createdAt: '2026-10-13T20:00:00.000Z',
    updatedAt: '2026-10-13T20:00:00.000Z',
  };
  expect(
    needsLowerPositionConfirmation(
      { season: 1, episode: 4 },
      '2026-10-13T20:10:00.000Z',
      latest,
    ),
  ).toBe(true);
  expect(
    needsLowerPositionConfirmation(
      { season: 1, episode: 4 },
      '2026-10-12T20:00:00.000Z',
      latest,
    ),
  ).toBe(false);
  expect(
    needsLowerPositionConfirmation(
      { season: 1, episode: 7 },
      '2026-10-13T20:10:00.000Z',
      latest,
    ),
  ).toBe(false);
});
