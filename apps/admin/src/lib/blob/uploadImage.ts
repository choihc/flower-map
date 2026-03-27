import { put } from '@vercel/blob';

export type UploadImageResult =
  | {
      success: true;
      data: {
        filename: string;
        contentType: string | null;
        url: string;
      };
      error: null;
    }
  | {
      success: false;
      data: {
        filename: string;
        contentType: string | null;
        url: null;
      };
      error: {
        code: 'upload_unavailable' | 'invalid_request';
        message: string;
      };
    };

export function invalidUploadRequest(message: string): UploadImageResult {
  return {
    success: false,
    data: {
      filename: '',
      contentType: null,
      url: null,
    },
    error: {
      code: 'invalid_request',
      message,
    },
  };
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  try {
    const blob = await put(file.name, file, { access: 'public' });
    return {
      success: true,
      data: {
        filename: file.name,
        contentType: file.type || null,
        url: blob.url,
      },
      error: null,
    };
  } catch (err) {
    console.error('[uploadImage] Blob 업로드 실패:', err);
    return {
      success: false,
      data: {
        filename: file.name,
        contentType: file.type || null,
        url: null,
      },
      error: {
        code: 'upload_unavailable',
        message: 'Blob 업로드에 실패했습니다.',
      },
    };
  }
}
