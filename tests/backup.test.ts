import { afterEach, expect, it } from 'vitest';
import { createDecipheriv, pbkdf2Sync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fixture, record } from './support';
import { digest } from '../src/core/files/integrity';
const fixtures: Awaited<ReturnType<typeof fixture>>[] = [];
async function setup() {
  const f = await fixture();
  fixtures.push(f);
  return f;
}
afterEach(async () => {
  for (const f of fixtures.splice(0)) await f.close();
});
const password = 'Test26';

it('round trips episodes, reminders, a real photo and PDF with independent AES-GCM verification', async () => {
  const f = await setup(),
    target = await setup();
  const r = record({
    totalEpisodes: 18,
    seasons: [8, 10],
    reminder: {
      interval: 'weekly',
      day: 5,
      month: 1,
      hour: 20,
      minute: 15,
      deliveryMode: 'normal',
      startsAtMillis: 1790884800000,
    },
  });
  await f.series.saveRecord(r);
  const d = await f.series.draft(r.id);
  d.form.season = '2';
  d.form.episode = '3';
  d.form.note = 'Synthetische Seriennotiz';
  d.form.attachments = [
    await f.series.importAttachment(
      new Uint8Array(
        await readFile(new URL('./fixtures/photo.jpg', import.meta.url)),
      ),
      'photo',
      'Testfoto.jpg',
    ),
  ];
  await f.series.saveEntry(d);
  await f.series.createReport(r.id, null, true);
  const bytes = await f.backup.create(password);
  const key = pbkdf2Sync(password, bytes.slice(12, 28), 600000, 32, 'sha256');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.slice(28, 40));
  cipher.setAAD(bytes.slice(0, 40));
  cipher.setAuthTag(bytes.slice(-16));
  const plain = Buffer.concat([
    cipher.update(bytes.slice(40, -16)),
    cipher.final(),
  ]);
  expect(plain.toString('utf8')).toContain('serienlog_backup');
  expect(
    Buffer.from(bytes).includes(Buffer.from('Synthetische Seriennotiz')),
  ).toBe(false);
  key.fill(0);
  const decoded = await target.backup.codec.decode(bytes, password);
  await target.backup.restore(decoded);
  const restored = await target.repo.snapshot();
  expect(restored.records).toEqual((await f.repo.snapshot()).records);
  expect(restored.entries[0]).toMatchObject({
    season: 2,
    episode: 3,
    note: d.form.note,
  });
  expect(restored.reports).toHaveLength(1);
  for (const item of [...restored.entries[0]!.attachments, ...restored.reports])
    expect(digest(await target.vault.read(item.file))).toBe(item.sha256);
  // An older backup must not undo a later local correction.
  const edit = await target.series.draft(r.id, restored.entries[0]);
  edit.form.note = 'Neuere lokale Notiz';
  await target.series.saveEntry(edit);
  await target.backup.restore(decoded);
  expect((await target.repo.snapshot()).entries[0]?.note).toBe(
    'Neuere lokale Notiz',
  );
});

it('rejects wrong passwords, corrupt files, foreign identity and invalid series without writes', async () => {
  const f = await setup(),
    r = record();
  await f.series.saveRecord(r);
  const before = await f.repo.snapshot();
  const bytes = await f.backup.create(password);
  await expect(f.backup.codec.decode(bytes, 'falsch')).rejects.toThrow(
    'Passwort',
  );
  const corrupted = bytes.slice();
  corrupted[corrupted.length - 1]! ^= 1;
  await expect(f.backup.codec.decode(corrupted, password)).rejects.toThrow(
    'beschädigt',
  );
  const foreign = bytes.slice();
  foreign.set(new TextEncoder().encode('HABACK01'));
  await expect(f.backup.codec.decode(foreign, password)).rejects.toThrow(
    'SerienLog',
  );
  await expect(f.backup.create('12345')).rejects.toThrow('6 bis 1024');
  await expect(
    f.backup.codec.encode(
      { ...before, records: [{ ...r, totalEpisodes: 4, seasons: [8] }] },
      new Map(),
      password,
    ),
  ).rejects.toThrow('Gesamtfolgenzahl');
  expect(await f.repo.snapshot()).toEqual(before);
});
