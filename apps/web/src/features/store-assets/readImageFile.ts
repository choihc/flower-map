export const LARGE_FILE_WARN_BYTES = 10 * 1024 * 1024; // 10MB 경고선

export type ReadImageResult = { dataUrl: string; warning: string | null };

export async function readImageFile(file: File): Promise<ReadImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`이미지 파일이 아닙니다: ${file.type || '알 수 없음'}`);
  }

  const warning =
    file.size > LARGE_FILE_WARN_BYTES
      ? `큰 파일입니다(${(file.size / 1024 / 1024).toFixed(1)}MB). 그대로 사용합니다.`
      : null;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('파일을 읽지 못했습니다.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });

  return { dataUrl, warning };
}
