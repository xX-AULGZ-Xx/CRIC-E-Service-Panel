import PortalDashboard from '@/components/portal/PortalDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRIC E-Service Panel | ศูนย์รวมบริการภายในวิทยาลัย',
  description: 'ศูนย์รวมบริการดิจิทัลวิทยาลัย CRIC เข้าสู่ระบบเพียงครั้งเดียว (SSO) ด้วย Keycloak และ Next.js',
};

export default function HomePage() {
  return <PortalDashboard />;
}
