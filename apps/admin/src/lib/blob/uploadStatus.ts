import type { UploadImageResult } from './uploadImage';

export function mapUploadResultStatus(result: UploadImageResult) {
  if (result.success) {
    return 200;
  }

  return result.error.code === 'invalid_request' ? 400 : 503;
}
