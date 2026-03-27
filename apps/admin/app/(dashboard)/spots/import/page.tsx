import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { saveImportPayloadAction } from '@/features/import/actions';
import { ImportConsole } from '@/features/import/ImportConsole';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function SpotImportPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await (supabase.from('spots') as any).select('slug').order('created_at', { ascending: true });

  if (error != null) {
    throw error;
  }

  const existingSpotSlugs = ((data ?? []) as Array<{ slug: string }>).map((spot) => spot.slug);

  return (
    <DashboardShell title="JSON 등록" description="검증용 JSON payload를 붙여 넣고 결과를 확인한 뒤 draft로 저장합니다.">
      <ImportConsole existingSpotSlugs={existingSpotSlugs} importAction={saveImportPayloadAction} />
    </DashboardShell>
  );
}
