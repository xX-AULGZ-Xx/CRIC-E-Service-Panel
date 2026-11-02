import AdminUsersManager from '@/components/admin/AdminUsersManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จัดการผู้ใช้งาน | CRIC E-Service Panel',
  description: 'จัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง และการระงับบัญชีในระบบ CRIC E-Service',
};

export default function AdminUsersPage() {
  return <AdminUsersManager />;
}
