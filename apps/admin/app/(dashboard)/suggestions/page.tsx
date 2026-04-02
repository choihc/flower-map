import type { SupabaseClient } from '@supabase/supabase-js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { listSuggestions } from '@/lib/data/suggestions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

export default async function SuggestionsPage() {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  const suggestions = await listSuggestions(client);

  return (
    <DashboardShell title="추천 접수" description="사용자가 추천한 명소 목록입니다.">
      <Card className="overflow-hidden">
        <CardHeader className="px-5 py-5">
          <CardTitle>접수 목록 ({suggestions.length}건)</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">접수된 추천이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">명소 이름</th>
                    <th className="pb-3 pr-4 font-medium">위치</th>
                    <th className="pb-3 pr-4 font-medium">추천 이유</th>
                    <th className="pb-3 font-medium">접수일</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{s.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.address ?? '-'}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.description ?? '-'}</td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
