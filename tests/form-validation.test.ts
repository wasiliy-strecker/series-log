import { expect, it } from 'vitest';
import type { EntryForm } from '../src/core/domain/models';
import { record } from './support';
import { validateRecordForm } from '../src/features/records/record-form-validation';
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

it('requires title and genre without asking for series counts', () => {
  const missing = validateRecordForm(record({ name: '', category: ' ' }));
  expect(missing.value).toBeNull();
  expect(missing.errors).toEqual({
    category: 'Bitte ein Genre eingeben.',
    name: 'Bitte einen Serientitel eingeben.',
  });
  expect(validateRecordForm(record()).value).not.toBeNull();
  expect(
    validateRecordForm(record({ note: 'x'.repeat(20001) })).errors,
  ).toHaveProperty('note');
});

it('requires independently valid positive season and episode values at their inputs', () => {
  const missing = validateEntryForm(
    entry({ season: '', episode: '', occurredAt: '' }),
  );
  expect(missing.position).toBeNull();
  expect(missing.errors).toHaveProperty('season');
  expect(missing.errors).toHaveProperty('episode');
  expect(missing.errors).toHaveProperty('occurredAt');
  for (const value of ['0', '-1', '1.5', '1,5', '1e2', '9007199254740992']) {
    expect(validateEntryForm(entry({ season: value })).errors).toHaveProperty(
      'season',
    );
    expect(validateEntryForm(entry({ episode: value })).errors).toHaveProperty(
      'episode',
    );
  }
  expect(
    validateEntryForm(entry({ season: ' 003 ', episode: '059' })).position,
  ).toEqual({ season: 3, episode: 59 });
});

it('maps save-time numeric errors to their inputs while retaining generic failure messages', () => {
  expect(
    entrySaveFieldErrors(
      new Error('Staffel: Bitte eine ganze Zahl größer als 0 eingeben.'),
    ),
  ).toHaveProperty('season');
  expect(
    entrySaveFieldErrors(
      new Error('Folge: Bitte eine ganze Zahl größer als 0 eingeben.'),
    ),
  ).toHaveProperty('episode');
  expect(
    entrySaveFieldErrors(new Error('Datenbank nicht verfügbar.')),
  ).toBeNull();
});
