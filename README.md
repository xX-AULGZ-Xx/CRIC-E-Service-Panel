# CRIC E-Service Panel (ศูนย์รวมบริการดิจิทัลวิทยาลัย CRIC)

ระบบศูนย์รวมบริการภายในวิทยาลัย CRIC ออกแบบตามแนวคิด **Single Sign-On (SSO)** เข้าสู่ระบบเพียงครั้งเดียวเพื่อเข้าใช้งานบริการภายในทั้งหมดได้อย่างสะดวก พร้อมหน้าต่าง **App Launcher (เมนู 9 จุดสไตล์ Google Workspace)** และหน้า **Admin Backoffice / REST API** สำหรับจัดการบริการ

---

## 🌟 คุณสมบัติเด่น (Features)

1. **Single Sign-On (SSO) ด้วย Keycloak**:
   - Central Identity Provider (OIDC / OAuth 2.0 Server) บน Docker
   - Realm: `cric-college` พร้อมรองรับ Role-Based Access Control (RBAC): `student`, `teacher`, `staff`, `admin`
   - ระบบภายในอื่นๆ สามารถเชื่อมต่อ OIDC เพื่อทำ SSO ได้ทันที
2. **หน้า Panel & App Launcher (ตามภาพ 9 จุดแบบ Google Workspace)**:
   - ไอคอน 9 จุดมุมขวาบน เปิด Popover Card ดีไซน์ Dark Theme หรูหรา
   - แถบ **"Your favorites"** พร้อมปุ่มดินสอแก้ไข เพื่อปักหมุด/ถอดหมุด และจัดระเบียบรายการโปรด
   - Grid แสดงไอคอนบริการแบบ 3 คอลัมน์ รองรับการแสดงผลคมชัด
3. **Embeddable Web Component / Script**:
   - สามารถนำโค้ด `<script src="http://localhost:3000/widget/launcher.js" defer></script>` ไปแปะในหัวเว็บของระบบภายในวิทยาลัยระบบอื่นๆ เพื่อให้มีปุ่ม 9 จุดเด้ง Launcher ได้จากทุกหน้าเว็บ
4. **Admin Service Management & REST API**:
   - หน้า `/admin/services` ให้ผู้ดูแลระบบเพิ่ม, แก้ไข, ลบ และจัดหมวดหมู่บริการ (CRUD)
   - อัปโหลดไอคอนภาพ/SVG หรือเลือกจากชุด Preset ไอคอนมาตรฐาน
   - กำหนดสิทธิ์การมองเห็นบริการตามกลุ่มผู้ใช้ (Role-Based Visibility)
   - REST API รองรับทั้งการดึงข้อมูล, การเพิ่มบริการ, และการบันทึก User Favorites

---

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js 16+ (App Router), TypeScript, Tailwind CSS
- **Identity Provider (SSO)**: Keycloak 26 (OpenID Connect / OAuth2)
- **Database**: PostgreSQL 16 (Multi-database: `cric_portal_db` และ `keycloak_db`)
- **ORM**: Prisma ORM
- **Containerization**: Docker & Docker Compose

---

## 🚀 วิธีการเริ่มต้นใช้งาน (Quick Start)

### วิธีที่ 1: รันทุก Service ด้วย Docker Compose (แนะนำสำหรับ Production / Testing)

```bash
# 1. โคลนหรือเปิดโฟลเดอร์โปรเจกต์
cd "CRIC E-Service Panel"

# 2. คัดลอกไฟล์ Environment
cp .env.example .env

# 3. รันทั้ง Keycloak, PostgreSQL, และ Next.js Portal ด้วย Docker Compose
docker compose up -d --build
```

เมื่อ Docker ทำงานสมบูรณ์:
- **CRIC E-Service Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Service Management**: [http://localhost:3000/admin/services](http://localhost:3000/admin/services)
- **Keycloak Admin Console**: [http://localhost:8080](http://localhost:8080)
  - Username: `admin`
  - Password: `admin`

---

### วิธีที่ 2: รันเครื่องแบบ Local Development

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เตรียมฐานข้อมูล (หรือเปิด Docker Postgres)
docker compose up -d postgres

# 3. ซิงค์สคีมาฐานข้อมูล
npx prisma db push

# 4. รัน Next.js Dev Server
npm run dev
```

เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 👥 บัญชีผู้ใช้เริ่มต้น (Pre-configured Users ใน Keycloak)

| บทบาท (Role) | บัญชีผู้ใช้ (Username) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | จัดการบริการทั้งหมด (Admin Backoffice) |
| **Teacher** | `teacher` | `teacher123` | เข้าถึงบริการสำหรับอาจารย์และบริการทั่วไป |
| **Student** | `student` | `student123` | เข้าถึงบริการสำหรับนักศึกษาและบริการทั่วไป |

> **หมายเหตุ**: ในโหมดพัฒนา สามารถคลิกที่ Badge บทบาทที่มุมขวาบนของ Navbar เพื่อสลับสวมบทบาท (Role Switcher) ทดสอบการมองเห็นบริการตามสิทธิ์ได้ทันทีโดยไม่ต้อง Log out

---

## 🔌 การนำ 9-Dots Launcher ไปแปะในเว็บระบบลูก (Embed Widget)

นำสคริปต์ด้านล่างนี้ไปวางไว้ก่อนปิดแท็ก `</body>` ในเว็บระบบลูก:

```html
<script src="http://localhost:3000/widget/launcher.js" defer></script>
```

ปุ่ม 9 จุดสไตล์ Google จะปรากฏที่มุมขวาบนของระบบนั้นโดยอัตโนมัติ พร้อมดึงรายการบริการและระบบ Single Sign-On ของผู้ใช้งาน

---

## 📡 REST API Reference

| Endpoint | Method | คำอธิบาย | สิทธิ์ (Auth) |
|---|---|---|---|
| `/api/v1/services` | `GET` | ดึงรายการบริการที่ผู้ใช้มีสิทธิ์เข้าถึง (RBAC) | Authenticated |
| `/api/v1/services?all=true` | `GET` | ดึงบริการทั้งหมดในระบบสำหรับหน้าจัดการ | Admin |
| `/api/v1/services` | `POST` | เพิ่มบริการใหม่ในระบบ | Admin |
| `/api/v1/services/:id` | `GET` | ดึงรายละเอียดบริการตาม ID | Authenticated |
| `/api/v1/services/:id` | `PUT` | แก้ไขข้อมูลบริการ | Admin |
| `/api/v1/services/:id` | `DELETE` | ลบบริการออกจากระบบ | Admin |
| `/api/v1/upload` | `POST` | อัปโหลดไฟล์รูปภาพหรือ SVG ไอคอน | Admin |
| `/api/v1/categories` | `GET` | ดึงรายการหมวดหมู่บริการ | Authenticated |
| `/api/v1/user/favorites` | `GET/POST` | ดึงหรือสลับปักหมุดบริการโปรดของผู้ใช้ | Authenticated |
| `/api/auth/session` | `GET/POST` | ตรวจสอบ Session ปัจจุบัน หรือสลับ Role | Public/Dev |

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
CRIC E-Service Panel/
├── docker/
│   ├── init-db.sql              # สคริปต์สร้างฐานข้อมูล Keycloak & Portal
│   └── realm-config.json        # คอนฟิก Realm และ Clients เริ่มต้นของ Keycloak
├── docker-compose.yml           # Multi-container Compose (Postgres, Keycloak, Next.js)
├── Dockerfile                   # Multi-stage production build สำหรับ Next.js
├── prisma/
│   └── schema.prisma            # โครงสร้างตาราง Service, Category, UserFavorite
├── public/
│   ├── uploads/                 # โฟลเดอร์เก็บไอคอนที่ Admin อัปโหลด
│   └── widget/
│       └── launcher.js          # สคริปต์ 9-Dots App Launcher สำหรับ Embed
└── src/
    ├── app/
    │   ├── admin/services/      # หน้า Admin จัดการบริการ (CRUD)
    │   ├── api/v1/              # REST API ทั้งหมด
    │   ├── globals.css
    │   └── page.tsx             # หน้า Portal Dashboard หลัก
    ├── components/
    │   ├── admin/               # ฟอร์มและตารางจัดการของ Admin
    │   ├── launcher/            # Component เมนู 9 จุดสไตล์ Google Workspace
    │   ├── layout/              # Navbar, Role Switcher, Search
    │   └── portal/              # Dashboard, Favorites Bar, Service Cards
    ├── lib/
    │   ├── auth.ts              # Session & RBAC helper
    │   └── prisma.ts            # Prisma client singleton
    └── types/
        └── service.ts           # Types & Data interfaces
```
