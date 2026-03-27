import { NextResponse } from 'next/server';

import { invalidUploadRequest, uploadImage, type UploadImageResult } from '@/lib/blob/uploadImage';

export function mapUploadResultStatus(result: UploadImageResult) {
  if (result.success) {
    return 200;
  }

  return result.error.code === 'invalid_request' ? 400 : 503;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(invalidUploadRequest('Expected a file field named "file".'), { status: 400 });
  }

  const result = await uploadImage(file);

  return NextResponse.json(result, { status: mapUploadResultStatus(result) });
}
