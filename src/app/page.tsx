import PortalDashboard from '@/components/portal/PortalDashboard';
import { Metadata } from 'next';
import { isSystemInstalled } from '@/lib/install';
import { getCurrentUserSession } from '@/lib/auth';
import { getSystemSettings } from '@/lib/settings';
import { getServicesForRole } from '@/lib/services';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'CRIC E-Service Panel | ศูนย์รวมบริการภายในวิทยาลัย',
  description: 'ศูนย์รวมบริการดิจิทัลวิทยาลัย CRIC เข้าสู่ระบบเพียงครั้งเดียว (SSO) ด้วย Keycloak และ Next.js',
};

export default async function HomePage() {
  if (!isSystemInstalled()) {
    redirect('/install');
  }

  const [session, settings] = await Promise.all([
    getCurrentUserSession().catch(() => null),
    getSystemSettings().catch(() => null),
  ]);

  const role = session?.currentRole || 'guest';
  const services = await getServicesForRole({
    role,
    userId: session?.userId,
  }).catch(() => []);

  // Ensure plain JSON-serializable objects for Client Component hydration
  const initialServices = JSON.parse(JSON.stringify(services));
  const initialSettings = settings ? JSON.parse(JSON.stringify(settings)) : null;
  const initialSession = session ? JSON.parse(JSON.stringify(session)) : null;

  return (
    <PortalDashboard
      initialSession={initialSession}
      initialServices={initialServices}
      initialSettings={initialSettings}
    />
  );
}
