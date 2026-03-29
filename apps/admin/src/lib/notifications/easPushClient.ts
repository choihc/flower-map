const EAS_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type EasPushTicket =
  | { status: 'ok' }
  | { status: 'error'; message: string };

type SendResult = { successCount: number; failureCount: number };

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function sendEasPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  accessToken?: string,
): Promise<SendResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const chunks = chunkArray(tokens, 100);
  let successCount = 0;
  let failureCount = 0;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({ to, title, body, sound: 'default' }));

    const res = await fetch(EAS_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      // EAS API HTTP 오류 시 해당 청크의 모든 토큰을 실패로 처리
      failureCount += chunk.length;
      continue;
    }

    const json = (await res.json()) as { data: EasPushTicket[] };
    for (const ticket of json.data) {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }

  return { successCount, failureCount };
}
