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

    // Format 1: phone number only (9-10 digits)
    if (/^\d{9,10}$/.test(text)) {
      await this.handlePhoneLookup(text, replyToken, lineUserId);
      return;
    }

    // Format 2: case number + phone (2 tokens, second token is 9-10 digits)
    const parts = text.split(/\s+/);
    if (parts.length === 2 && /^\d{9,10}$/.test(parts[1])) {
      await this.handleCaseVerification(parts[0], parts[1], replyToken, lineUserId);
      return;
    }

    // Number selection from list (purely numeric)
    if (/^\d+$/.test(text)) {
      const links = await this.prisma.lineVerification.findMany({
        where: { lineUserId },
        include: { case: true },
        orderBy: { case: { createdAt: 'asc' } },
      });
      const num = parseInt(text, 10);
      if (links.length > 0 && num >= 1 && num <= links.length) {
        await this.reply(replyToken, this.formatCaseDetail(links[num - 1].case));
        return;
      }
    }

    // Fallback: help message
    await this.reply(replyToken, this.helpMessage());
  }

  private async handlePhoneLookup(phone: string, replyToken: string, lineUserId: string) {
    const cases = await this.casesService.findByPhone(phone);
    if (cases.length === 0) {
      await this.reply(
        replyToken,
        `❌ ไม่พบคดีที่เชื่อมกับเบอร์ ${phone}\n\nกรุณาตรวจสอบเบอร์โทรศัพท์ของท่าน`,
      );
      return;
    }

    // Link all cases with this phone to the LINE user
    await this.prisma.$transaction(
      cases.map((c) =>
        this.prisma.lineVerification.upsert({
          where: { lineUserId_caseId: { lineUserId, caseId: c.id } },
          create: { lineUserId, caseId: c.id },
          update: {},
        }),
      ),
    );

    if (cases.length === 1) {
      await this.reply(replyToken, `✅ พบคดีของคุณ\n\n${this.formatCaseDetail(cases[0])}`);
      return;
    }

    const caseList = cases
      .map((c, i) => `${i + 1}. ${c.caseNumber} — ${c.title}\n   ${STATUS_LABEL[c.status] ?? c.status}`)
      .join('\n\n');

    await this.reply(
      replyToken,
      `📋 พบคดีของคุณทั้งหมด ${cases.length} คดี\n\n${caseList}\n\nพิมพ์ตัวเลข (1, 2, ...) เพื่อดูรายละเอียด`,
    );
  }

  private async handleCaseVerification(caseNumber: string, phone: string, replyToken: string, lineUserId: string) {
    try {
      const matched = await this.casesService.findByCaseNumberAndPhone(caseNumber.toUpperCase(), phone);

      await this.prisma.lineVerification.upsert({
        where: { lineUserId_caseId: { lineUserId, caseId: matched.id } },
        create: { lineUserId, caseId: matched.id },
        update: {},
      });

      await this.reply(replyToken, `✅ ยืนยันสำเร็จ\n\n${this.formatCaseDetail(matched)}`);
    } catch {
      await this.reply(
        replyToken,
        '❌ ไม่พบคดีที่ตรงกัน\n\nกรุณาตรวจสอบรหัสคดีและเบอร์โทรศัพท์ให้ถูกต้อง',
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

  private helpMessage(): string {
    return (
      'สวัสดีครับ 👮\n\n' +
      'วิธีตรวจสอบสถานะคดี:\n\n' +
      '1️⃣ ส่งเบอร์โทรศัพท์ของท่าน\n' +
      'ตัวอย่าง: 0812345678\n\n' +
      '2️⃣ ส่งรหัสคดี + เบอร์โทร\n' +
      'ตัวอย่าง: 002/2569 0812345678'
    );
  }

  private reply(replyToken: string, text: string) {
    return this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }
}
