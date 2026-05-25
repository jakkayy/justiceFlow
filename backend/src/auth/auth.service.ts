import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const officer = await this.prisma.officer.findUnique({ where: { email } });
    if (!officer) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, officer.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: officer.id, email: officer.email, role: officer.role };
    return {
      accessToken: this.jwtService.sign(payload),
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        stationName: officer.stationName,
      },
    };
  }
}
