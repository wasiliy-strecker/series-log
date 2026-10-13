import { expect, it } from 'vitest';
import type { EntryForm } from '../src/core/domain/models';
import { record } from './support';
import {
  recordSaveFieldErrors,
  validateRecordForm,
} from '../src/features/records/record-form-validation';
import {
  entrySaveFieldErrors,
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
  const missing = validateRecordForm(
    record({ name: '', category: ' ' }),
    '',
    [],
  );
  expect(missing.value).toBeNull();
  expect(missing.errors).toMatchObject({
    category: 'Bitte ein Genre eingeben.',
    name: 'Bitte einen Serientitel eingeben.',
  });

  const invalid = validateRecordForm(record(), '5', ['8', 'x']);
  expect(invalid.errors['season-1']).toContain('ganze Zahl');
  const total = validateRecordForm(record(), '5', ['8']);
  expect(total.errors.totalEpisodes).toContain('Gesamtfolgenzahl');
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
  ).toHaveProperty('season-1');
  expect(
    entrySaveFieldErrors(
      new Error(
        'Staffel 1 hat 8 Folgen. Ein gespeicherter Folgenstand darf diese Zahl nicht überschreiten.',
      ),
    ),
  ).toHaveProperty('episode');
});
