import { Controller, Headers, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LineService } from './line.service';
import * as crypto from 'crypto';
import type { Request } from 'express';

@Controller('line')
export class LineController {
  constructor(
    private lineService: LineService,
    private config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
  ) {
    const secret = this.config.getOrThrow<string>('LINE_CHANNEL_SECRET');
    const rawBody = req.rawBody;

    if (!rawBody) throw new UnauthorizedException('Missing body');

    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    if (hash !== signature) throw new UnauthorizedException('Invalid signature');

    const body = JSON.parse(rawBody.toString()) as { events: any[] };
    await this.lineService.handleWebhook(body.events ?? []);
    return { status: 'ok' };
  }
}
