import { describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.example.com/flower.jpg' }),
}));

import { uploadImage } from './uploadImage';

describe('uploadImage', () => {
  it('returns success result with blob url on upload', async () => {
    const file = new File(['demo'], 'flower.jpg', { type: 'image/jpeg' });

    const result = await uploadImage(file);

    expect(result.success).toBe(true);
    expect(result.data.url).toBe('https://blob.example.com/flower.jpg');
    expect(result.data.filename).toBe('flower.jpg');
    expect(result.data.contentType).toBe('image/jpeg');
    expect(result.error).toBeNull();
  });

  it('returns content type as null when file has no type', async () => {
    const file = new File(['demo'], 'flower.jpg', { type: '' });

    const result = await uploadImage(file);

    expect(result.data.contentType).toBeNull();
  });
});
