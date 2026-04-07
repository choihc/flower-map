import { DashboardShell } from '@/features/dashboard/DashboardShell';

import { NotificationsForm } from './NotificationsForm';

export default function NotificationsPage() {
  return (
    <DashboardShell
      title="알림 발송"
      description="앱을 설치한 전체 사용자에게 푸시 알림을 발송합니다."
    >
      <NotificationsForm />
    </DashboardShell>
  );
}
