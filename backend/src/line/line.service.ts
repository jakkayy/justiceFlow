import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messagingApi } from '@line/bot-sdk';
import { CasesService } from '../cases/cases.service';

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
  ) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: this.config.get('LINE_CHANNEL_ACCESS_TOKEN'),
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
    const text: string = event.message.text.trim();
    const replyToken: string = event.replyToken;

    try {
      const caseData = await this.casesService.findByCaseNumber(text);
      const statusLabel = STATUS_LABEL[caseData.status] ?? caseData.status;
      await this.client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: `📁 คดีหมายเลข: ${caseData.caseNumber}\n📌 เรื่อง: ${caseData.title}\n🔖 สถานะ: ${statusLabel}\n\nอัปเดตล่าสุด: ${caseData.updatedAt.toLocaleDateString('th-TH')}`,
          },
        ],
      });
    } catch {
      await this.client.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: 'ไม่พบเลขคดีที่ระบุ กรุณาตรวจสอบเลขคดีและลองใหม่อีกครั้ง' }],
      });
    }
  }
}
