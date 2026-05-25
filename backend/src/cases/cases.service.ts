import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStatus } from '@prisma/client';

@Injectable()
export class CasesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.case.findMany({
      include: { officer: { select: { name: true, stationName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.case.findUnique({
      where: { id },
      include: {
        officer: { select: { name: true, stationName: true } },
        attachments: true,
      },
    });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  async findByCaseNumber(caseNumber: string) {
    const c = await this.prisma.case.findUnique({ where: { caseNumber } });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  create(data: {
    caseNumber: string;
    title: string;
    description: string;
    victimName: string;
    victimPhone: string;
    victimLineId?: string;
    officerId: string;
  }) {
    return this.prisma.case.create({ data });
  }

  async updateStatus(id: string, status: CaseStatus, note: string, officerId: string) {
    const c = await this.findOne(id);
    const historyEntry = {
      status,
      note,
      changedBy: officerId,
      changedAt: new Date().toISOString(),
    };
    return this.prisma.case.update({
      where: { id },
      data: {
        status,
        statusHistory: { push: historyEntry },
      },
    });
  }

  update(id: string, data: Partial<{ title: string; description: string; victimPhone: string; victimLineId: string }>) {
    return this.prisma.case.update({ where: { id }, data });
  }
}
