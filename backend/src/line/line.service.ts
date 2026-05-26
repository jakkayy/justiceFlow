import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messagingApi } from '@line/bot-sdk';
import { CasesService } from '../cases/cases.service';
import { PrismaService } from '../prisma/prisma.service';

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: '📋 รับเรื่องแล้ว',
  INVESTIGATING: '🔍 อยู่ระหว่างสืบสวน',
  PROSECUTING: '⚖️ ส่งฟ้องอัยการ',
  CLOSED: '✅ ปิดคดีแล้ว',
};

@Injectable()
export class LineService {
  private client: messagingApi.MessagingApiClient;

  constructor(
    private config: ConfigService,
    private casesService: CasesService,
    private prisma: PrismaService,
  ) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: this.config.getOrThrow<string>('LINE_CHANNEL_ACCESS_TOKEN'),
    });
  }

  async handleWebhook(events: any[]) {
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await this.handleTextMessage(event);
      }
    }
  }

  private async handleTextMessage(event: any) {
    const text: string = (event.message.text as string).trim();
    const replyToken: string = event.replyToken as string;
    const lineUserId: string = event.source.userId as string;

    const verifiedLinks = await this.prisma.lineVerification.findMany({
      where: { lineUserId },
      include: { case: true },
      orderBy: { case: { createdAt: 'asc' } },
    });

    if (verifiedLinks.length > 0) {
      await this.handleVerifiedUser(text, replyToken, verifiedLinks);
    } else {
      await this.handleUnverifiedUser(text, replyToken, lineUserId);
    }
  }

  private async handleVerifiedUser(text: string, replyToken: string, verifiedLinks: any[]) {
    const specificLink = verifiedLinks.find(
      (l) => l.case.caseNumber.toUpperCase() === text.toUpperCase(),
    );

    if (specificLink) {
      const c = specificLink.case;
      await this.reply(replyToken, this.formatCaseDetail(c));
      return;
    }

    const caseList = verifiedLinks
      .map((l, i) => `${i + 1}. ${l.case.caseNumber} — ${l.case.title}\n   ${STATUS_LABEL[l.case.status] ?? l.case.status}`)
      .join('\n\n');

    await this.reply(
      replyToken,
      `📋 คดีของคุณทั้งหมด (${verifiedLinks.length} คดี)\n\n${caseList}\n\nพิมพ์หมายเลขคดีเพื่อดูรายละเอียด`,
    );
  }

  private async handleUnverifiedUser(text: string, replyToken: string, lineUserId: string) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await this.reply(
        replyToken,
        'สวัสดีครับ 👮\n\nเพื่อตรวจสอบสถานะคดี กรุณาส่งข้อมูลในรูปแบบ:\n\n<หมายเลขคดี> <เบอร์โทรศัพท์>\n\nตัวอย่าง:\nJF-2026-001 0812345678',
      );
      return;
    }

    const [caseNumber, phone] = parts;

    try {
      const matched = await this.casesService.findByCaseNumberAndPhone(
        caseNumber.toUpperCase(),
        phone,
      );

      const allCases = await this.casesService.findByPhone(matched.victimPhone);

      await this.prisma.$transaction(
        allCases.map((c) =>
          this.prisma.lineVerification.upsert({
            where: { lineUserId_caseId: { lineUserId, caseId: c.id } },
            create: { lineUserId, caseId: c.id },
            update: {},
          }),
        ),
      );

      if (allCases.length === 1) {
        await this.reply(
          replyToken,
          `✅ ยืนยันตัวตนสำเร็จ\n\n${this.formatCaseDetail(matched)}`,
        );
      } else {
        const caseList = allCases
          .map((c, i) => `${i + 1}. ${c.caseNumber} — ${c.title}\n   ${STATUS_LABEL[c.status] ?? c.status}`)
          .join('\n\n');
        await this.reply(
          replyToken,
          `✅ ยืนยันตัวตนสำเร็จ\n\nพบคดีของคุณทั้งหมด ${allCases.length} คดี:\n\n${caseList}\n\nพิมพ์หมายเลขคดีเพื่อดูรายละเอียด`,
        );
      }
    } catch {
      await this.reply(
        replyToken,
        '❌ ไม่พบข้อมูลที่ตรงกัน\n\nกรุณาตรวจสอบหมายเลขคดีและเบอร์โทรศัพท์ แล้วลองใหม่\n\nรูปแบบ: <หมายเลขคดี> <เบอร์โทรศัพท์>',
      );
    }
  }

  private formatCaseDetail(c: any): string {
    const statusLabel = STATUS_LABEL[c.status] ?? c.status;
    const updatedAt = new Date(c.updatedAt).toLocaleDateString('th-TH', { dateStyle: 'medium' });
    return (
      `📁 คดีหมายเลข: ${c.caseNumber}\n` +
      `📌 เรื่อง: ${c.title}\n` +
      `🔖 สถานะ: ${statusLabel}\n` +
      `\nอัปเดตล่าสุด: ${updatedAt}`
    );
  }

  private reply(replyToken: string, text: string) {
    return this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }
}
