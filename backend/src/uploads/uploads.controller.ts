import { Controller, Delete, Get, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cases/:caseId/attachments')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Param('caseId') caseId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.uploadsService.uploadFile(file, caseId, req.user.id);
  }

  @Get(':attachmentId/download')
  getDownloadUrl(@Param('attachmentId') attachmentId: string) {
    return this.uploadsService.getDownloadUrl(attachmentId);
  }

  @Delete(':attachmentId')
  delete(@Param('attachmentId') attachmentId: string) {
    return this.uploadsService.deleteFile(attachmentId);
  }
}
