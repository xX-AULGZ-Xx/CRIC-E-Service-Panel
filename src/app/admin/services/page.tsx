import AdminServicesManager from '@/components/admin/AdminServicesManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Management | CRIC E-Service Panel',
  description: 'จัดการบริการภายในวิทยาลัย CRIC E-Service Panel',
};

export default function AdminServicesPage() {
  return <AdminServicesManager />;
}
