import { NextResponse } from 'next/server';

import { uploadImage } from '@/lib/blob/uploadImage';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: 'Expected a file field named "file".',
      },
      { status: 400 },
    );
  }

  const result = await uploadImage(file);

  return NextResponse.json(result, { status: 501 });
}
