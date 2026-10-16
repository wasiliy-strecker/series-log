import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ExpoVault } from '../src/core/files/expo-vault';
import { ExpoMedia } from '../src/core/media/media-service';
import { fixture, sourcePdf } from './support';

const io = vi.hoisted(() => ({
  files: new Map<string, Uint8Array>(),
  move: vi.fn<() => Promise<void>>(),
  copy: vi.fn<() => Promise<void>>(),
  share: vi.fn(),
  sharePdfs: vi.fn(),
  nextId: 0,
}));
vi.mock('expo-crypto', () => ({
  randomUUID: () =>
    `00000000-0000-4000-8000-${String(++io.nextId).padStart(12, '0')}`,
}));
vi.mock('expo-file-system', () => {
  const uri = (parts: (string | { uri: string })[]) =>
    parts
      .map((p) => (typeof p === 'string' ? p : p.uri))
      .join('/')
      .replace(/([^:])\/+/g, '$1/');
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(parts);
    }
    get exists() {
      return io.files.has(this.uri);
    }
    write(bytes: Uint8Array) {
      io.files.set(this.uri, bytes.slice());
    }
    async bytes() {
      const bytes = io.files.get(this.uri);
      if (!bytes) throw new Error('Missing test file');
      return bytes.slice();
    }
    delete() {
      io.files.delete(this.uri);
    }
    async move(destination: File) {
      await io.move();
      io.files.set(destination.uri, await this.bytes());
      this.delete();
      this.uri = destination.uri;
    }
    async copy(destination: File) {
      await io.copy();
      io.files.set(destination.uri, await this.bytes());
    }
    get name() {
      return this.uri.split('/').at(-1)!;
    }
  }
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(parts);
    }
    create() {}
    list() {
      return [...io.files.keys()]
        .filter((key) => key.startsWith(this.uri + '/'))
        .map((key) => new File(key));
    }
    delete() {
      for (const key of io.files.keys())
        if (key.startsWith(this.uri + '/')) io.files.delete(key);
    }
  }
  return {
    File,
    Directory,
    Paths: { document: 'file:///documents', cache: 'file:///cache' },
  };
});
vi.mock('expo-image-picker', () => ({}));
vi.mock('expo-document-picker', () => ({}));
vi.mock('expo-image-manipulator', () => ({
  ImageManipulator: {},
  SaveFormat: {},
}));
vi.mock('expo-sharing', () => ({ shareAsync: io.share }));
vi.mock('../src/core/native/series-native', () => ({
  seriesNative: { sharePdfs: io.sharePdfs },
}));

let f: Awaited<ReturnType<typeof fixture>>;
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
beforeEach(async () => {
  vi.resetAllMocks();
  io.files.clear();
  io.move.mockResolvedValue(undefined);
  io.copy.mockResolvedValue(undefined);
  f = await fixture();
});
afterEach(async () => {
  await f.close();
});

it('publishes a vault file only after its asynchronous move has completed', async () => {
  const gate = deferred();
  io.move.mockReturnValueOnce(gate.promise);
  const vault = new ExpoVault();
  const bytes = new Uint8Array([1, 2, 3]);
  let finished = false;
  const saving = vault.put(bytes, 'jpg').then((key) => {
    finished = true;
    return key;
  });
  try {
    await vi.waitFor(() => expect(io.move).toHaveBeenCalledOnce());
    expect(finished).toBe(false);
    expect(await vault.list()).toEqual([]);
  } finally {
    gate.resolve();
  }
  const key = await saving;
  expect(await vault.read(key)).toEqual(bytes);
  expect(await vault.list()).toEqual([key]);
});

it('propagates an asynchronous move failure and removes its temporary file', async () => {
  io.move.mockRejectedValueOnce(new Error('SYNTHETIC_MOVE_FAILURE'));
  await expect(new ExpoVault().put(new Uint8Array([1]), 'jpg')).rejects.toThrow(
    'SYNTHETIC_MOVE_FAILURE',
  );
  expect(io.files.size).toBe(0);
});

it('waits for the backup sharing copy and never opens sharing after a copy error', async () => {
  const media = new ExpoMedia(f.series);
  const prepared = await media.prepareBackup(new Uint8Array([1, 2, 3]));
  const gate = deferred();
  io.copy.mockReturnValueOnce(gate.promise);
  const sharing = media.shareBackup(prepared);
  try {
    await vi.waitFor(() => expect(io.copy).toHaveBeenCalledOnce());
    expect(io.share).not.toHaveBeenCalled();
  } finally {
    gate.resolve();
  }
  await sharing;
  const destination = io.share.mock.calls[0]![0] as string;
  expect(io.files.get(destination)).toEqual(new Uint8Array([1, 2, 3]));
  io.share.mockClear();
  io.copy.mockRejectedValueOnce(new Error('SYNTHETIC_COPY_FAILURE'));
  await expect(media.shareBackup(prepared)).rejects.toThrow(
    'SYNTHETIC_COPY_FAILURE',
  );
  expect(io.share).not.toHaveBeenCalled();
  expect(io.files.has(prepared.uri)).toBe(true);
});

it('waits for every PDF part before handing its URIs to Android', async () => {
  const bytes = await sourcePdf();
  const attachment = await f.series.importAttachment(bytes, 'pdf', 'Test.pdf');
  io.files.set(f.vault.uri(attachment.file), bytes);
  const gate = deferred();
  io.copy.mockResolvedValueOnce(undefined).mockReturnValueOnce(gate.promise);
  const sharing = new ExpoMedia(f.series).shareMany([attachment, attachment]);
  try {
    await vi.waitFor(() => expect(io.copy).toHaveBeenCalledTimes(2));
    expect(io.sharePdfs).not.toHaveBeenCalled();
  } finally {
    gate.resolve();
  }
  await sharing;
  const uris = io.sharePdfs.mock.calls[0]![0] as string[];
  expect(uris).toHaveLength(2);
  expect(new Set(uris).size).toBe(2);
  for (const uri of uris) expect(io.files.get(uri)).toEqual(bytes);
});
