import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadsService implements OnModuleInit {
  private s3: S3Client;
  private bucket: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.bucket = this.config.get('MINIO_BUCKET_NAME', 'justiceflow');
    this.s3 = new S3Client({
      endpoint: `http://${this.config.get('MINIO_ENDPOINT')}:${this.config.get('MINIO_PORT')}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.get('MINIO_ROOT_USER'),
        secretAccessKey: this.config.get('MINIO_ROOT_PASSWORD'),
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, caseId: string, officerId: string) {
    const ext = path.extname(file.originalname);
    const storagePath = `cases/${caseId}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return this.prisma.caseAttachment.create({
      data: {
        caseId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storagePath,
        uploadedById: officerId,
      },
    });
  }

  async deleteFile(attachmentId: string) {
    const attachment = await this.prisma.caseAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) return;

    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: attachment.storagePath }));
    await this.prisma.caseAttachment.delete({ where: { id: attachmentId } });
  }
}
