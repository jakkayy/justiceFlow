# JusticeFlow

ระบบติดตามความคืบหน้าคดีความสำหรับเจ้าหน้าที่ตำรวจ ผู้เสียหายสามารถตรวจสอบสถานะคดีผ่าน LINE OA และเจ้าหน้าที่สามารถบริหารจัดการคดีผ่านระบบหลังบ้าน

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16, Tailwind CSS, shadcn/ui, NextAuth v5 |
| Backend | NestJS 11, Prisma 5, Passport JWT |
| Database | PostgreSQL 16 |
| File Storage | MinIO (S3-compatible) |
| LINE Integration | LINE Messaging API |
| Infrastructure | Docker Compose |

## โครงสร้างโปรเจค

```
justiceFlow/
├── frontend/          # Next.js Admin UI
├── backend/           # NestJS API
├── docker-compose.yml # PostgreSQL + MinIO
├── Makefile           # Command shortcuts
└── .env.example       # Template สำหรับ environment variables
```

## เริ่มต้นใช้งาน

### ความต้องการ

- Node.js >= 20.9.0
- Docker + Docker Compose

### 1. ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env` ตามต้องการ จากนั้นสร้าง `backend/.env`:

```bash
cp backend/.env.example backend/.env   # หรือตั้งค่าเองตาม .env.example
```

และ `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
AUTH_SECRET=your-random-secret-here
AUTH_TRUST_HOST=true
NEXT_PUBLIC_LINE_OA_ID=@your-line-oa-id
```

### 2. รัน Infrastructure

```bash
make up
```

PostgreSQL จะรันที่ port `5433` และ MinIO ที่ port `9000` (Console: `9001`)

### 3. ตั้งค่า Database

```bash
make db-migrate   # สร้าง tables
make db-seed      # สร้าง admin account เริ่มต้น
```

Test accounts (สร้างจาก seed):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@justiceflow.local` | `admin1234` |
| เจ้าหน้าที่ | `somchai@justiceflow.local` | `password1234` |
| เจ้าหน้าที่ | `wanida@justiceflow.local` | `password1234` |
| เจ้าหน้าที่ | `prasit@justiceflow.local` | `password1234` |

### 4. รันแอปพลิเคชัน

```bash
# Terminal 1 - Backend
make backend

# Terminal 2 - Frontend
make frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- MinIO Console: http://localhost:9001

## Makefile Commands

```bash
make up           # เปิด Docker services
make down         # ปิด Docker services
make logs         # ดู logs

make db-migrate   # รัน Prisma migrations
make db-seed      # Seed ข้อมูลเริ่มต้น
make db-reset     # Reset DB ทั้งหมด
make db-studio    # เปิด Prisma Studio

make backend      # รัน NestJS (watch mode)
make frontend     # รัน Next.js
make build        # Build backend
```

## API Endpoints

| Method | Path | Description |
|---|---|---|---|
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET | `/api/cases` | รายการคดีทั้งหมด |
| POST | `/api/cases` | สร้างคดีใหม่ |
| GET | `/api/cases/:id` | รายละเอียดคดี |
| PATCH | `/api/cases/:id/status` | อัปเดตสถานะคดี |
| POST | `/api/cases/:id/attachments` | อัปโหลดไฟล์ |
| DELETE | `/api/cases/:id/attachments/:attachmentId` | ลบไฟล์ |
| GET | `/api/officers` | รายการเจ้าหน้าที่ | 
| POST | `/api/officers` | เพิ่มเจ้าหน้าที่ |
| POST | `/api/line/webhook` | LINE Webhook |

## LINE OA Integration

ผู้เสียหายตรวจสอบสถานะคดีผ่าน LINE OA โดยไม่ต้องลงทะเบียน

**การยืนยันตัวตนครั้งแรก** — ส่งข้อความในรูปแบบ:
```
<หมายเลขคดี> <เบอร์โทรศัพท์>
ตัวอย่าง: JF-2026-001 0812345678
```
ระบบจะเชื่อม LINE account กับทุกคดีที่ใช้เบอร์เดียวกันโดยอัตโนมัติ

**หลังยืนยันแล้ว** — ส่งข้อความอะไรก็ได้เพื่อดูรายการคดีทั้งหมด หรือพิมพ์หมายเลขคดีเพื่อดูรายละเอียด

**QR Code** — หน้าสร้างคดีใหม่จะแสดง QR Code ให้เจ้าหน้าที่โชว์ผู้เสียหายสแกนเพิ่มเพื่อน LINE OA ทันที

ตั้งค่า Webhook URL ใน LINE Developers Console:
```
https://your-domain.com/api/line/webhook
```

## Database Schema

```
Officer       — เจ้าหน้าที่ตำรวจ (ADMIN / OFFICER)
Case          — ข้อมูลคดีและสถานะ
CaseAttachment — ไฟล์แนบที่เก็บใน MinIO
LineVerification — การยืนยันตัวตนผ่าน LINE
```

สถานะคดี: `RECEIVED` → `INVESTIGATING` → `PROSECUTING` → `CLOSED`
