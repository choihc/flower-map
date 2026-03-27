import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { SpotForm } from '@/features/spots/SpotForm';

export default function SpotsPage() {
  return (
    <DashboardShell title="명소 관리">
      <p>명소를 draft로 저장하고 검토 후 published로 전환합니다.</p>
      <SpotForm />
    </DashboardShell>
  );
}
