import { Body, Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LineService } from './line.service';
import * as crypto from 'crypto';

@Controller('line')
export class LineController {
  constructor(
    private lineService: LineService,
    private config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() body: { events: any[] },
    @Headers('x-line-signature') signature: string,
  ) {
    const secret = this.config.get<string>('LINE_CHANNEL_SECRET');
    const bodyStr = JSON.stringify(body);
    const hash = crypto.createHmac('sha256', secret).update(bodyStr).digest('base64');

    if (hash !== signature) throw new UnauthorizedException('Invalid signature');

    await this.lineService.handleWebhook(body.events);
    return { status: 'ok' };
  }
}
