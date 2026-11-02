import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DEFAULT_SERVICES = [
  {
    id: 'srv-plan',
    title: 'ระบบแผนงานและงบประมาณ (CRIC Plan)',
    description: 'ระบบติดตามแผนปฏิบัติราชการ การเบิกจ่ายงบประมาณ และรายงานโครงการประจำปี',
    url: 'https://plan.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965313.png',
    categoryId: 'cat-research-plan',
    allowedRoles: ['teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: true,
    sortOrder: 1,
  },
  {
    id: 'srv-rcms',
    title: 'ระบบบริหารงานวิจัยและวิทยาลัย (CRIC RCMS)',
    description: 'ระบบยื่นข้อเสนอโครงการวิจัย นวัตกรรมสิ่งประดิษฐ์ และทรัพย์สินทางปัญญา',
    url: 'https://rcms.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png',
    categoryId: 'cat-research-plan',
    allowedRoles: ['teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: true,
    sortOrder: 2,
  },
  {
    id: 'srv-reg',
    title: 'ระบบสารสนเทศทะเบียนนักศึกษา (E-Registrar)',
    description: 'ลงทะเบียนเรียน ตรวจสอบผลการเรียน ตารางสอบ และพิมพ์ใบรับรองสภาพนักศึกษา',
    url: 'https://reg.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3429/3429284.png',
    categoryId: 'cat-academic',
    allowedRoles: ['student', 'teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: true,
    sortOrder: 3,
  },
  {
    id: 'srv-classroom',
    title: 'Google Classroom (CRIC Workspace)',
    description: 'ห้องเรียนออนไลน์สำหรับส่งการบ้าน สื่อการสอน และการประชุมผ่าน Google Meet',
    url: 'https://classroom.google.com',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png',
    categoryId: 'cat-academic',
    allowedRoles: ['student', 'teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: true,
    sortOrder: 4,
  },
  {
    id: 'srv-edoc',
    title: 'ระบบสารบรรณและเอกสาร (E-Document)',
    description: 'ระบบรับ-ส่งหนังสือราชการอิเล็กทรอนิกส์ การเกษียนหนังสือ และหนังสือเวียน',
    url: 'https://edoc.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965280.png',
    categoryId: 'cat-admin-hr',
    allowedRoles: ['staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: false,
    sortOrder: 5,
  },
  {
    id: 'srv-gemini',
    title: 'CRIC Gemini AI Assistant',
    description: 'เครื่องมือปัญญาประดิษฐ์ช่วยสอน ค้นคว้างานวิจัย และสรุปเนื้อหาสำหรับนักศึกษา',
    url: 'https://gemini.google.com',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/11865/11865326.png',
    categoryId: 'cat-tools-it',
    allowedRoles: ['student', 'teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: false,
    sortOrder: 6,
  },
  {
    id: 'srv-library',
    title: 'ห้องสมุดดิจิทัล (CRIC E-Library)',
    description: 'ยืม-คืนหนังสือออนไลน์ ฐานข้อมูลงานวิจัยวิทยาลัย และ E-Books',
    url: 'https://library.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png',
    categoryId: 'cat-academic',
    allowedRoles: ['student', 'teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: false,
    sortOrder: 7,
  },
  {
    id: 'srv-helpdesk',
    title: 'ศูนย์รับเรื่องร้องเรียนและ IT Helpdesk',
    description: 'แจ้งปัญหาอินเทอร์เน็ต ขอรีเซ็ตรหัสผ่านอีเมล และแจ้งซ่อมอุปกรณ์คอมพิวเตอร์',
    url: 'https://helpdesk.cric.ac.th',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4233/4233830.png',
    categoryId: 'cat-tools-it',
    allowedRoles: ['student', 'teacher', 'staff', 'admin'],
    openInNewTab: true,
    isActive: true,
    isDefaultFavorite: false,
    sortOrder: 8,
  },
];

async function main() {
  console.log('Seeding initial categories and services...');

  const categories = [
    { id: 'cat-academic', name: 'การเรียนการสอนและวิชาการ', description: 'ระบบที่เกี่ยวข้องกับการเรียนการสอน', sortOrder: 1 },
    { id: 'cat-research-plan', name: 'งานวิจัยและแผนงาน', description: 'ระบบบริหารงานวิจัยและงบประมาณ', sortOrder: 2 },
    { id: 'cat-admin-hr', name: 'งานบริหารและบุคคล', description: 'ระบบงานสารบรรณและบุคลากร', sortOrder: 3 },
    { id: 'cat-tools-it', name: 'เครื่องมือและไอที', description: 'แอปพลิเคชันและบริการช่วยเหลือด้านเทคโนโลยี', sortOrder: 4 },
  ];

  try {
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
        create: cat,
      });
    }

    const jsonServices = [];

    for (const srv of DEFAULT_SERVICES) {
      const created = await prisma.service.upsert({
        where: { id: srv.id },
        update: {
          title: srv.title,
          description: srv.description,
          url: srv.url,
          iconUrl: srv.iconUrl,
          categoryId: srv.categoryId,
          allowedRoles: srv.allowedRoles,
          openInNewTab: srv.openInNewTab,
          isActive: srv.isActive,
          isDefaultFavorite: srv.isDefaultFavorite,
          sortOrder: srv.sortOrder,
        },
        create: srv,
        include: {
          category: true,
        },
      });

      jsonServices.push(created);
    }

    // Persist to local backup file
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'services.json'), JSON.stringify(jsonServices, null, 2), 'utf-8');

    console.log(`Successfully seeded ${jsonServices.length} default services into database and fallback JSON!`);
  } catch (err) {
    console.error('Database seed error:', err);
    // Write fallback JSON file
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'services.json'), JSON.stringify(DEFAULT_SERVICES, null, 2), 'utf-8');
    console.log('Successfully written services to fallback JSON file!');
  } finally {
    await prisma.$disconnect();
  }
}

main();
