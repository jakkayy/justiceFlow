import { Body, Controller, Get, Param, Patch, Post, UseGuards, Request } from '@nestjs/common';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CaseStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class CreateCaseDto {
  @IsString() caseNumber: string;
  @IsString() title: string;
  @IsString() description: string;
  @IsString() victimName: string;
  @IsString() victimPhone: string;
  @IsOptional() @IsString() victimLineId?: string;
}

class UpdateStatusDto {
  @IsEnum(CaseStatus) status: CaseStatus;
  @IsString() note: string;
}

@UseGuards(JwtAuthGuard)
@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCaseDto, @Request() req) {
    return this.casesService.create({ ...dto, officerId: req.user.id });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Request() req) {
    return this.casesService.updateStatus(id, dto.status, dto.note, req.user.id);
  }
}
