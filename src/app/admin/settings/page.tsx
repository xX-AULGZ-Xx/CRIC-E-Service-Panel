import AdminSettingsManager from '@/components/admin/AdminSettingsManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'การตั้งค่าระบบ | CRIC E-Service Panel',
  description: 'ตั้งค่าข้อมูลวิทยาลัย, พฤติกรรมหน้า Portal, โหมดปิดปรับปรุง และ SSO Keycloak',
};

export default function AdminSettingsPage() {
  return <AdminSettingsManager />;
}
