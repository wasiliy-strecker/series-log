import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Attachment, EntryDraft } from '../domain/models';
import type { SeriesService } from '../../features/entries/entry-service';
import { seriesNative } from '../native/series-native';
import { verifiedFile } from '../files/integrity';
import { MAX_BACKUP_BYTES } from '../backup/backup-service';

export type PreparedBackup = { uri: string; name: string };
export type PickResult = { attachments: Attachment[]; failures: string[] };
type ShareItem = { file: string; sha256: string; name?: string };
export interface MediaPort {
  pick(
    source: NonNullable<EntryDraft['external']>,
    multiple?: boolean,
  ): Promise<PickResult>;
  recoverPhotos(): Promise<PickResult>;
  open(item: { file: string; sha256: string }): Promise<void>;
  share(item: ShareItem): Promise<void>;
  shareMany(items: ShareItem[]): Promise<void>;
  prepareBackup(bytes: Uint8Array): Promise<PreparedBackup>;
  saveBackup(file: PreparedBackup): Promise<'saved' | 'cancelled'>;
  shareBackup(file: PreparedBackup): Promise<void>;
  discardBackup(file: PreparedBackup): Promise<void>;
  pickBackup(): Promise<Uint8Array | null>;
}
export class ExpoMedia implements MediaPort {
  constructor(private series: SeriesService) {}
  async importPhoto(asset: ImagePicker.ImagePickerAsset): Promise<Attachment> {
    const manipulator = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > 1920)
      manipulator.resize(
        asset.width >= asset.height ? { width: 1920 } : { height: 1920 },
      );
    const rendered = await manipulator.renderAsync();
    const result = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.88,
    });
    // Android's Bitmap encoder creates fresh JPEG bytes with no inherited EXIF.
    try {
      return await this.series.importAttachment(
        await new File(result.uri).bytes(),
        'photo',
        asset.fileName?.replace(/\.[^.]*$/, '.jpg') || 'Foto.jpg',
      );
    } finally {
      new File(result.uri).delete();
      rendered.release();
      manipulator.release();
    }
  }
  private async photos(
    result:
      ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null,
  ): Promise<PickResult> {
    const output: PickResult = { attachments: [], failures: [] };
    if (!result) return output;
    if ('code' in result) {
      output.failures.push(
        result.message ||
          'Die Fotoauswahl konnte nicht wiederhergestellt werden.',
      );
      return output;
    }
    if (result.canceled) return output;
    for (const asset of result.assets) {
      try {
        output.attachments.push(await this.importPhoto(asset));
      } catch {
        output.failures.push(
          `${asset.fileName || 'Foto'} konnte nicht übernommen werden.`,
        );
      }
    }
    return output;
  }
  async pick(
    source: NonNullable<EntryDraft['external']>,
    multiple = true,
  ): Promise<PickResult> {
    if (source === 'camera') {
      if (!(await ImagePicker.requestCameraPermissionsAsync()).granted)
        throw new Error(
          'Die Kamera ist nicht freigegeben. Du kannst Fotos aus der Galerie wählen.',
        );
      return this.photos(
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 1,
          exif: false,
        }),
      );
    }
    if (source === 'gallery')
      return this.photos(
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: multiple,
          quality: 1,
          exif: false,
        }),
      );
    throw new Error('Unbekannte Bildquelle.');
  }
  async recoverPhotos() {
    return this.photos(await ImagePicker.getPendingResultAsync());
  }
  async open(item: { file: string; sha256: string }) {
    await verifiedFile(this.series.vault, item);
    try {
      await seriesNative.openPdf(this.series.vault.uri(item.file));
    } catch {
      throw new Error(
        'Keine App zum Öffnen von PDFs verfügbar. Bitte eine PDF-App installieren oder „Teilen“ verwenden.',
      );
    }
  }
  private sharedCopy(item: ShareItem, directory: Directory, fallback: string) {
    const name =
      (item.name || fallback)
        .replace(/\.pdf$/i, '')
        .replace(/[^\p{L}\p{N} ._-]/gu, '_')
        .slice(0, 160) + '.pdf';
    const copy = new File(directory, name);
    new File(this.series.vault.uri(item.file)).copy(copy);
    return copy.uri;
  }
  async share(item: ShareItem) {
    await verifiedFile(this.series.vault, item);
    if (!(await Sharing.isAvailableAsync()))
      throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
    let uri = this.series.vault.uri(item.file);
    if (item.file.endsWith('.pdf') && item.name) {
      const directory = new Directory(
        Paths.cache,
        'exports',
        `share-${this.series.env.id()}`,
      );
      directory.create({ intermediates: true, idempotent: true });
      uri = this.sharedCopy(item, directory, 'Serienprotokoll');
    }
    await Sharing.shareAsync(uri, {
      mimeType: item.file.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    });
  }
  async shareMany(items: ShareItem[]) {
    if (!items.length) throw new Error('Keine Protokollteile vorhanden.');
    for (const item of items) await verifiedFile(this.series.vault, item);
    const directory = new Directory(
      Paths.cache,
      'exports',
      `share-${this.series.env.id()}`,
    );
    directory.create({ intermediates: true, idempotent: true });
    try {
      const uris = items.map((item, i) =>
        this.sharedCopy(
          {
            ...item,
            name: `Serienprotokoll_Teil_${String(i + 1).padStart(2, '0')}_von_${items.length}`,
          },
          directory,
          'Serienprotokoll',
        ),
      );
      await seriesNative.sharePdfs(uris);
      // Android reads the content URIs after the chooser resolves. Keep these
      // disposable copies in cache while the receiving app consumes them.
    } catch (error) {
      directory.delete();
      throw error;
    }
  }
  async prepareBackup(bytes: Uint8Array): Promise<PreparedBackup> {
    const directory = new Directory(Paths.cache, 'exports');
    directory.create({ intermediates: true, idempotent: true });
    const name = `SerienLog-${new Date().toISOString().replace(/[:.]/g, '-')}.slbackup`;
    const file = new File(directory, name);
    try {
      file.write(bytes);
      return { uri: file.uri, name };
    } catch (error) {
      if (file.exists) file.delete();
      throw error;
    }
  }
  async saveBackup(file: PreparedBackup) {
    return (await seriesNative.saveBackupFile(file.uri, file.name)).status;
  }
  async shareBackup(file: PreparedBackup) {
    const directory = new Directory(Paths.cache, 'shared-backups');
    directory.create({ idempotent: true, intermediates: true });
    const copy = new File(directory, file.name);
    new File(file.uri).copy(copy);
    await Sharing.shareAsync(copy.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'SerienLog-Backup teilen',
    });
  }
  async discardBackup(file: PreparedBackup) {
    const directory = new Directory(Paths.cache, 'exports');
    if (
      !file.uri.startsWith(directory.uri.replace(/\/$/, '') + '/') ||
      file.uri.slice(directory.uri.replace(/\/$/, '').length + 1).includes('/')
    )
      throw new Error('Ungültige Backup-Referenz.');
    const stored = new File(file.uri);
    if (stored.exists) stored.delete();
  }
  async pickBackup() {
    const result = await DocumentPicker.getDocumentAsync({
      // Android providers store the custom .slbackup extension as binary data.
      // Keep the extension check below because other binary files share this MIME.
      type: 'application/octet-stream',
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset?.name.toLowerCase().endsWith('.slbackup'))
      throw new Error('Bitte eine .slbackup-Datei auswählen.');
    const file = new File(asset.uri);
    if (file.size > MAX_BACKUP_BYTES)
      throw new Error('Das Backup ist größer als 128 MB.');
    return file.bytes();
  }
}
