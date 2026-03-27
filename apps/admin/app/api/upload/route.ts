import { NextResponse } from 'next/server';

import { invalidUploadRequest, uploadImage } from '@/lib/blob/uploadImage';
import { mapUploadResultStatus } from '@/lib/blob/uploadStatus';

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (err) {
    console.error('[POST /api/upload] formData 파싱 실패:', err);
    return NextResponse.json(invalidUploadRequest('요청 본문을 읽을 수 없습니다.'), { status: 400 });
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    console.error('[POST /api/upload] file 필드 없음. 받은 키:', [...formData.keys()]);
    return NextResponse.json(invalidUploadRequest('Expected a file field named "file".'), { status: 400 });
  }

  console.log('[POST /api/upload] 업로드 시작:', file.name, file.type, file.size, 'bytes');
  const result = await uploadImage(file);
  console.log('[POST /api/upload] 업로드 결과:', result.success ? 'success' : result.error);

  return NextResponse.json(result, { status: mapUploadResultStatus(result) });
}
