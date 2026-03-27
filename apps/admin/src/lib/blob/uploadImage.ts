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
};

export async function uploadImage(file: File): Promise<UploadImageResult> {
  return {
    success: false,
    data: {
      filename: file.name,
      contentType: file.type || null,
      url: null,
    },
    error: {
      code: 'upload_unavailable',
      message: 'Implement Vercel Blob upload after wiring env vars.',
    },
  };
}
