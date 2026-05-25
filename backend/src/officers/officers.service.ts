import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OfficersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.officer.findMany({
      select: { id: true, name: true, badgeNumber: true, email: true, role: true, stationName: true, createdAt: true },
    });
  }

  async create(data: {
    name: string;
    badgeNumber: string;
    email: string;
    password: string;
    role?: Role;
    stationName: string;
  }) {
    const exists = await this.prisma.officer.findFirst({
      where: { OR: [{ email: data.email }, { badgeNumber: data.badgeNumber }] },
    });
    if (exists) throw new ConflictException('Email or badge number already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const { password, ...rest } = data;
    return this.prisma.officer.create({ data: { ...rest, passwordHash } });
  }
}
