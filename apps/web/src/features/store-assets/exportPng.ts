/**
 * 추출 대상 노드를 PNG Blob으로 캡처한다.
 *
 * 사전 조건:
 * - 노드는 실제 출력 픽셀 사이즈로 렌더링되어 있어야 한다(예: 1242×2688).
 * - 노드는 transform이 걸리지 않은 컨테이너에 마운트되어 있어야 한다(미리보기 노드 금지).
 *
 * 캡처 전:
 * - document.fonts.ready 를 await 해 웹폰트 로딩 보장.
 * - 내부 <img>들의 decode()를 await 해 디코드 완료 보장.
 */
export async function captureNodeToPng(node: HTMLElement, width: number, height: number): Promise<Blob> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const images = Array.from(node.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      if (typeof img.decode === 'function') {
        try {
          await img.decode();
        } catch {
          // decode 실패해도 onload 대기로 폴백
          await new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }
      }
    }),
  );

  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(node, { pixelRatio: 1, width, height, cacheBust: true });
  if (!blob) {
    throw new Error('PNG 생성에 실패했습니다.');
  }
  return blob;
}
