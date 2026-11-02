import PortalDashboard from '@/components/portal/PortalDashboard';
import { Metadata } from 'next';
import { isSystemInstalled } from '@/lib/install';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'CRIC E-Service Panel | ศูนย์รวมบริการภายในวิทยาลัย',
  description: 'ศูนย์รวมบริการดิจิทัลวิทยาลัย CRIC เข้าสู่ระบบเพียงครั้งเดียว (SSO) ด้วย Keycloak และ Next.js',
};

export default function HomePage() {
  if (!isSystemInstalled()) {
    redirect('/install');
  }
  return <PortalDashboard />;
}
