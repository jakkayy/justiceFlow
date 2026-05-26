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

  async findByCaseNumberAndPhone(caseNumber: string, phone: string) {
    const c = await this.prisma.case.findFirst({ where: { caseNumber, victimPhone: phone } });
    if (!c) throw new NotFoundException('Case not found');
    return c;
  }

  findByPhone(phone: string) {
    return this.prisma.case.findMany({ where: { victimPhone: phone }, orderBy: { createdAt: 'asc' } });
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear() + 543;
    const suffix = `/${year}`;
    const latest = await this.prisma.case.findFirst({
      where: { caseNumber: { endsWith: suffix } },
      orderBy: { caseNumber: 'desc' },
    });
    const next = latest ? parseInt(latest.caseNumber.replace(suffix, ''), 10) + 1 : 1;
    return `${String(next).padStart(3, '0')}${suffix}`;
  }

  async create(data: {
    title: string;
    description: string;
    victimName: string;
    victimPhone: string;
    victimLineId?: string;
    officerId: string;
  }) {
    const caseNumber = await this.generateCaseNumber();
    return this.prisma.case.create({ data: { ...data, caseNumber } });
  }

  async updateStatus(id: string, status: CaseStatus, note: string, officerId: string) {
    const c = await this.findOne(id);
    const officer = await this.prisma.officer.findUnique({ where: { id: officerId }, select: { name: true } });
    const historyEntry = {
      status,
      note,
      changedBy: officerId,
      changedByName: officer?.name ?? 'เจ้าหน้าที่',
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
