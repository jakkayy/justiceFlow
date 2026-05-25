import { Controller, Delete, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
    @UploadedFile() file: Express.Multer.File,
    @Param('caseId') caseId: string,
    @Request() req,
  ) {
    return this.uploadsService.uploadFile(file, caseId, req.user.id);
  }

  @Delete(':attachmentId')
  delete(@Param('attachmentId') attachmentId: string) {
    return this.uploadsService.deleteFile(attachmentId);
  }
}
