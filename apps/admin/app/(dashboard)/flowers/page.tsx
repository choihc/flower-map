import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { FlowerForm } from '@/features/flowers/FlowerForm';

export default function FlowersPage() {
  return (
    <DashboardShell title="꽃 관리">
      <p>꽃 종류를 추가하고 시즌, 정렬, 활성화 상태를 관리합니다.</p>
      <FlowerForm />
    </DashboardShell>
  );
}
