import { NextResponse } from 'next/server';

import { invalidUploadRequest, uploadImage } from '@/lib/blob/uploadImage';
import { mapUploadResultStatus } from '@/lib/blob/uploadStatus';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(invalidUploadRequest('Expected a file field named "file".'), { status: 400 });
  }

  const result = await uploadImage(file);

  return NextResponse.json(result, { status: mapUploadResultStatus(result) });
}
