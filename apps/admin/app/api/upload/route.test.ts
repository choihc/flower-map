import { describe, expect, it } from 'vitest';

import { mapUploadResultStatus } from './route';

describe('mapUploadResultStatus', () => {
  it('maps invalid_request failures to HTTP 400', () => {
    expect(
      mapUploadResultStatus({
        success: false,
        data: {
          filename: 'flower.jpg',
          contentType: 'image/jpeg',
          url: null,
        },
        error: {
          code: 'invalid_request',
          message: 'Bad file',
        },
      }),
    ).toBe(400);
  });

  it('maps upload_unavailable failures to HTTP 503', () => {
    expect(
      mapUploadResultStatus({
        success: false,
        data: {
          filename: 'flower.jpg',
          contentType: 'image/jpeg',
          url: null,
        },
        error: {
          code: 'upload_unavailable',
          message: 'Not configured',
        },
      }),
    ).toBe(503);
  });
});
