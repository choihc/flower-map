import { describe, expect, it } from 'vitest';

import { uploadImage } from './uploadImage';

describe('uploadImage', () => {
  it('returns a stable error contract that can later be replaced by real blob uploads', async () => {
    const file = new File(['demo'], 'flower.jpg', { type: 'image/jpeg' });

    const result = await uploadImage(file);

    expect(result.success).toBe(false);
    expect(result.data).toEqual({
      filename: 'flower.jpg',
      contentType: 'image/jpeg',
      url: null,
    });
    expect(result.error).toEqual({
      code: 'upload_unavailable',
      message: 'Implement Vercel Blob upload after wiring env vars.',
    });
  });
});
