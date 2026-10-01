import { describe, expect, it } from 'vitest';
import {
  episodeDelta,
  progress,
  validateProgress,
  wholeNumber,
} from '../src/core/domain/progress';
import { record } from './support';

describe('series progress', () => {
  it('counts complete prior seasons and supports episode zero', () => {
    const r = record({ seasons: [8, 10], totalEpisodes: 18 });
    expect(progress(r, { season: 2, episode: 3 })).toMatchObject({
      watched: 11,
      percent: 61,
    });
    expect(progress(r, { season: 2, episode: 0 }).watched).toBe(8);
    expect(
      episodeDelta(r, { season: 2, episode: 3 }, { season: 1, episode: 6 }),
    ).toBe(5);
  });
  it('does not invent totals or percentages when season lengths are unknown', () => {
    expect(progress(record(), { season: 1, episode: 4 })).toMatchObject({
      watched: 4,
      percent: null,
    });
    expect(
      progress(record({ totalEpisodes: 24 }), { season: 2, episode: 4 }),
    ).toMatchObject({ watched: null, percent: null });
    expect(
      episodeDelta(
        record(),
        { season: 2, episode: 4 },
        { season: 2, episode: 1 },
      ),
    ).toBe(3);
    expect(
      episodeDelta(
        record(),
        { season: 2, episode: 4 },
        { season: 1, episode: 8 },
      ),
    ).toBeNull();
  });
  it('supports lower corrections without counting repeat viewing twice', () => {
    const r = record({ seasons: [8] });
    expect(
      episodeDelta(r, { season: 1, episode: 6 }, { season: 2, episode: 3 }),
    ).toBe(-5);
    expect(
      episodeDelta(r, { season: 1, episode: 6 }, { season: 1, episode: 6 }),
    ).toBe(0);
  });
  it('shows 100 percent only when all known total episodes are watched', () => {
    const r = record({ totalEpisodes: 200 });
    expect(progress(r, { season: 1, episode: 199 }).percent).toBe(99);
    expect(progress(r, { season: 1, episode: 200 }).percent).toBe(100);
  });
  it('rejects totals and season edits which contradict saved positions', () => {
    expect(() =>
      validateProgress(record({ seasons: [8, 10], totalEpisodes: 12 }), []),
    ).toThrow('Gesamtfolgenzahl');
    expect(() =>
      validateProgress(record({ seasons: [8] }), [{ season: 1, episode: 9 }]),
    ).toThrow('Staffel 1');
    expect(() =>
      validateProgress(record({ totalEpisodes: 8 }), [
        { season: 1, episode: 9 },
      ]),
    ).toThrow('Gesamtfolgenzahl');
  });
  it('rejects positions that exceed the total even when prior lengths are unknown', () => {
    expect(() =>
      validateProgress(record({ totalEpisodes: 10, seasons: [8] }), [
        { season: 3, episode: 3 },
      ]),
    ).toThrow('Gesamtfolgenzahl');
  });
  it('accepts whole numbers only, including pasted input', () => {
    expect(wholeNumber(' 003 ', 'Folge')).toBe(3);
    for (const value of ['', '-1', '1,5', '1.5', '1e2', '1 000', '1000001'])
      expect(() => wholeNumber(value, 'Folge')).toThrow();
    expect(() => wholeNumber('0', 'Staffel', 1, 200)).toThrow();
  });
});
