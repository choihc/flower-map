import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { ImportConsole } from '@/features/import/ImportConsole';

export default function SpotImportPage() {
  return (
    <DashboardShell title="JSON 등록">
      <p>검증용 JSON payload를 붙여 넣고 명소 등록 결과를 미리 확인합니다.</p>
      <ImportConsole />
    </DashboardShell>
  );
}
