import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OfficersService } from './officers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

class CreateOfficerDto {
  @IsString() name: string;
  @IsString() badgeNumber: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsString() stationName: string;
}

@UseGuards(JwtAuthGuard)
@Controller('officers')
export class OfficersController {
  constructor(private officersService: OfficersService) {}

  @Get()
  findAll() {
    return this.officersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateOfficerDto) {
    return this.officersService.create(dto);
  }
}
