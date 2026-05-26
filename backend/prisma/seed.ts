import { PrismaClient, Role, CaseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Officers ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password1234', 10);
  const adminHash = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.officer.upsert({
    where: { email: 'admin@justiceflow.local' },
    update: {},
    create: {
      name: 'พ.ต.อ. สมชาย รักษาดี',
      badgeNumber: 'ADMIN001',
      email: 'admin@justiceflow.local',
      passwordHash: adminHash,
      role: Role.ADMIN,
      stationName: 'กองบังคับการสำนักงานกลาง',
    },
  });

  const officer1 = await prisma.officer.upsert({
    where: { email: 'somchai@justiceflow.local' },
    update: {},
    create: {
      name: 'ร.ต.อ. สมศักดิ์ ใจดี',
      badgeNumber: 'OFF001',
      email: 'somchai@justiceflow.local',
      passwordHash,
      role: Role.OFFICER,
      stationName: 'สถานีตำรวจนครบาลบางรัก',
    },
  });

  const officer2 = await prisma.officer.upsert({
    where: { email: 'wanida@justiceflow.local' },
    update: {},
    create: {
      name: 'ร.ต.ท. วนิดา มั่นคง',
      badgeNumber: 'OFF002',
      email: 'wanida@justiceflow.local',
      passwordHash,
      role: Role.OFFICER,
      stationName: 'สถานีตำรวจนครบาลพระโขนง',
    },
  });

  const officer3 = await prisma.officer.upsert({
    where: { email: 'prasit@justiceflow.local' },
    update: {},
    create: {
      name: 'ด.ต. ประสิทธิ์ เร็วไว',
      badgeNumber: 'OFF003',
      email: 'prasit@justiceflow.local',
      passwordHash,
      role: Role.OFFICER,
      stationName: 'สถานีตำรวจนครบาลลาดพร้าว',
    },
  });

  console.log('✅ Officers seeded:', [admin, officer1, officer2, officer3].map((o) => o.email));

  // ─── Cases ────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const cases = [
    {
      caseNumber: '001/2567',
      title: 'คดีลักทรัพย์ในที่พักอาศัย',
      description: 'ผู้เสียหายแจ้งว่ามีคนงัดแงะบ้านพักและขโมยทรัพย์สินมูลค่ากว่า 150,000 บาท ได้แก่ ทองรูปพรรณ เงินสด และอุปกรณ์อิเล็กทรอนิกส์',
      status: CaseStatus.CLOSED,
      victimName: 'นางสาวพิมพ์ใจ สุขสมบูรณ์',
      victimPhone: '081-234-5678',
      officerId: officer1.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'รับแจ้งความจากผู้เสียหาย ตรวจสอบที่เกิดเหตุเบื้องต้นแล้ว', daysAgo: 30 },
        { status: CaseStatus.INVESTIGATING, note: 'เก็บหลักฐานลายนิ้วมือ กล้องวงจรปิดบริเวณใกล้เคียง และสอบปากคำเพื่อนบ้าน', daysAgo: 25 },
        { status: CaseStatus.PROSECUTING, note: 'จับกุมผู้ต้องหาได้แล้ว 1 ราย ส่งฟ้องอัยการเขตบางรัก', daysAgo: 10 },
        { status: CaseStatus.CLOSED, note: 'ศาลพิพากษาจำคุก 2 ปี คดีสิ้นสุด', daysAgo: 2 },
      ],
    },
    {
      caseNumber: '002/2567',
      title: 'คดีฉ้อโกงทางออนไลน์',
      description: 'ผู้เสียหายถูกหลอกลวงให้โอนเงินผ่านแอปพลิเคชันในนามบริษัทลงทุนปลอม รวมมูลค่าความเสียหาย 320,000 บาท',
      status: CaseStatus.PROSECUTING,
      victimName: 'นายวิชัย ธนาพร',
      victimPhone: '089-876-5432',
      officerId: officer2.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'รับแจ้งความ รวบรวมหลักฐานการโอนเงินและหมายเลขบัญชีปลายทาง', daysAgo: 45 },
        { status: CaseStatus.INVESTIGATING, note: 'ประสานงานธนาคารอายัดบัญชี และติดตามร่องรอยทางดิจิทัล', daysAgo: 35 },
        { status: CaseStatus.PROSECUTING, note: 'ออกหมายจับผู้ต้องหา 2 ราย ส่งสำนวนให้อัยการ', daysAgo: 5 },
      ],
    },
    {
      caseNumber: '003/2567',
      title: 'คดีทำร้ายร่างกาย',
      description: 'ผู้เสียหายถูกทำร้ายร่างกายบริเวณหน้าร้านสะดวกซื้อ ได้รับบาดเจ็บที่ศีรษะและแขน เข้ารับการรักษาที่โรงพยาบาลกรุงเทพ',
      status: CaseStatus.INVESTIGATING,
      victimName: 'นายอนันต์ ปลอดภัย',
      victimPhone: '062-111-2233',
      officerId: officer1.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'รับแจ้งเหตุ ผู้เสียหายได้รับการรักษาพยาบาลแล้ว', daysAgo: 15 },
        { status: CaseStatus.INVESTIGATING, note: 'ตรวจสอบกล้องวงจรปิด สอบปากคำพยาน และออกหมายเรียกผู้ต้องสงสัย', daysAgo: 10 },
      ],
    },
    {
      caseNumber: '004/2567',
      title: 'คดียาเสพติดให้โทษ',
      description: 'จับกุมผู้ต้องหาครอบครองยาบ้าจำนวน 500 เม็ด และเฮโรอีน 50 กรัม บริเวณชุมชนลาดพร้าว 80',
      status: CaseStatus.PROSECUTING,
      victimName: 'พนักงานอัยการ (คดีรัฐ)',
      victimPhone: '02-515-0000',
      officerId: officer3.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'จับกุมผู้ต้องหาได้พร้อมของกลาง', daysAgo: 20 },
        { status: CaseStatus.INVESTIGATING, note: 'ส่งของกลางตรวจพิสูจน์ สอบสวนขยายผลหาแหล่งที่มา', daysAgo: 14 },
        { status: CaseStatus.PROSECUTING, note: 'ส่งฟ้องอัยการพิเศษฝ่ายคดียาเสพติด', daysAgo: 3 },
      ],
    },
    {
      caseNumber: '005/2567',
      title: 'คดีรถยนต์ถูกขโมย',
      description: 'ผู้เสียหายจอดรถยนต์ Toyota Fortuner สีดำ ทะเบียน กข-1234 กรุงเทพมหานคร บริเวณห้างสรรพสินค้า แล้วพบว่ารถหายไป',
      status: CaseStatus.INVESTIGATING,
      victimName: 'นางมาลี ทรัพย์มั่น',
      victimPhone: '085-999-8877',
      officerId: officer2.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'รับแจ้งความ ออกประกาศแจ้งเตือนไปยังด่านตรวจทั่วกรุงเทพฯ', daysAgo: 7 },
        { status: CaseStatus.INVESTIGATING, note: 'ตรวจสอบกล้องวงจรปิดในห้างและเส้นทางโดยรอบ พบรถต้องสงสัย', daysAgo: 4 },
      ],
    },
    {
      caseNumber: '006/2567',
      title: 'คดีทุจริตการเงิน',
      description: 'พนักงานบริษัทยักยอกเงินนายจ้างผ่านการออกใบเสร็จปลอมสะสมเป็นเวลา 8 เดือน มูลค่าความเสียหายรวม 1,200,000 บาท',
      status: CaseStatus.RECEIVED,
      victimName: 'บริษัท สยามพาณิชย์ จำกัด',
      victimPhone: '02-888-9999',
      officerId: officer3.id,
      history: [
        { status: CaseStatus.RECEIVED, note: 'รับแจ้งความ รวบรวมเอกสารทางการเงินและหลักฐานจากผู้แจ้งความ', daysAgo: 2 },
      ],
    },
  ];

  for (const c of cases) {
    const { history, ...caseData } = c;

    const statusHistory = history.map((h: { status: CaseStatus; note: string; daysAgo: number }) => ({
      status: h.status,
      note: h.note,
      changedAt: daysAgo(h.daysAgo).toISOString(),
      changedBy: caseData.officerId,
    }));

    await prisma.case.upsert({
      where: { caseNumber: caseData.caseNumber },
      update: {},
      create: {
        ...caseData,
        statusHistory,
        createdAt: daysAgo(history[0].daysAgo),
      },
    });

    console.log(`✅ Case seeded: ${caseData.caseNumber} — ${caseData.title}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin   : admin@justiceflow.local / admin1234');
  console.log('   Officer1: somchai@justiceflow.local / password1234');
  console.log('   Officer2: wanida@justiceflow.local / password1234');
  console.log('   Officer3: prasit@justiceflow.local / password1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
