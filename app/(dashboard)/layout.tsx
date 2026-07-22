import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let orgName = '';
  let orgSlug = '';

  try {
    const session = await requireSession();
    orgName = session.orgName ?? '';
    orgSlug = session.orgSlug ?? '';
  } catch {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar orgName={orgName} orgSlug={orgSlug} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
