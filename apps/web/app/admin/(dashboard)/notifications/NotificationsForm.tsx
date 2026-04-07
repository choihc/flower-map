'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SendResult = {
  totalTokens: number;
  successCount: number;
  failureCount: number;
};

export function NotificationsForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? '발송에 실패했습니다.');
        return;
      }

      const json = (await res.json()) as SendResult;
      setResult(json);
      setTitle('');
      setBody('');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="notif-title">제목</label>
        <Input
          id="notif-title"
          placeholder="예: 벚꽃 축제 시작!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="notif-body">내용</label>
        <Textarea
          id="notif-body"
          placeholder="예: 여의도 윤중로 벚꽃이 만개했습니다. 지금 바로 확인해보세요!"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={loading || !title.trim() || !body.trim()}
        className="w-full"
      >
        {loading ? '발송 중...' : '전체 발송'}
      </Button>

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">발송 완료</p>
          <p className="mt-1 text-green-700">
            총 {result.totalTokens}명 중 성공 {result.successCount}건, 실패 {result.failureCount}건
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-800">오류</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
