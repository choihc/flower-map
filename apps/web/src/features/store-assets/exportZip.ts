import type { Platform } from './designTokens';

export type ZipEntry = {
  platform: Platform;
  filename: string; // 예: "ios-1-hotel.png"
  blob: Blob;
};

/**
 * 14장(iOS 7 + Android 7) blob을 ios/ android/ 폴더로 분리한 ZIP으로 묶어 다운로드한다.
 */
export async function downloadAsZip(entries: ZipEntry[], dateStr: string): Promise<void> {
  const [{ default: JSZip }, { saveAs }] = await Promise.all([
    import('jszip'),
    import('file-saver'),
  ]);

  const zip = new JSZip();
  const iosFolder = zip.folder('ios');
  const androidFolder = zip.folder('android');
  if (!iosFolder || !androidFolder) {
    throw new Error('ZIP 폴더 생성 실패');
  }

  for (const entry of entries) {
    const folder = entry.platform === 'ios' ? iosFolder : androidFolder;
    folder.file(entry.filename, entry.blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `store-assets-${dateStr}.zip`);
}

export function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
