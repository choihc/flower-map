import { DashboardShell } from '@/features/dashboard/DashboardShell';
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
    <DashboardShell title="JSON 등록">
      <p>검증용 JSON payload를 붙여 넣고 명소 등록 결과를 미리 확인합니다.</p>
      <ImportConsole existingSpotSlugs={existingSpotSlugs} />
    </DashboardShell>
  );
}
