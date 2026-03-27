export type UploadImageResult = {
  ok: false;
  message: string;
  filename: string;
};

export async function uploadImage(file: File): Promise<UploadImageResult> {
  return {
    ok: false,
    message: 'Implement Vercel Blob upload after wiring env vars.',
    filename: file.name,
  };
}
