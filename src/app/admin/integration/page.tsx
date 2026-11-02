import AdminIntegrationManager from '@/components/admin/AdminIntegrationManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เชื่อมต่อระบบลูกข่าย (Integration Hub) | CRIC E-Service Panel',
  description: 'ข้อมูล Client Credentials, OIDC Endpoints และเครื่องมือจำลอง Token สำหรับระบบลูกข่ายวิทยาลัย CRIC',
};

export default function AdminIntegrationPage() {
  return <AdminIntegrationManager />;
}
