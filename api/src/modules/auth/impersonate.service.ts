import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ImpersonationCode } from '../platform/entities/impersonation-code.entity.js';
import { PlatformAuditLog, AuditAction } from '../platform/entities/platform-audit-log.entity.js';
import { TenantMembership } from './entities/tenant-membership.entity.js';
import { UserRole } from './entities/user.entity.js';

@Injectable()
export class ImpersonateService {
  constructor(
    @InjectRepository(ImpersonationCode)
    private readonly codeRepo: Repository<ImpersonationCode>,
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
    @InjectRepository(TenantMembership)
    private readonly membershipRepo: Repository<TenantMembership>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  private get merchantCookieBase() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict' as const,
      domain: this.isProduction ? (this.configService.get<string>('MERCHANT_COOKIE_DOMAIN') ?? 'picky.ar') : undefined,
    };
  }

  async exchange(code: string, res: Response): Promise<{ tenantId: string; role: UserRole; message: string }> {
    // Atomic mark-as-used: prevents race conditions where two simultaneous requests
    // consume the same one-time code before either marks it used.
    const record = await this.codeRepo.manager.transaction(async (em) => {
      const found = await em.findOne(ImpersonationCode, {
        where: { code, used: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!found) {
        const exists = await em.findOne(ImpersonationCode, { where: { code } });
        if (exists?.used) throw new UnauthorizedException('Código ya utilizado.');
        throw new UnauthorizedException('Código inválido.');
      }

      if (found.expiresAt < new Date()) {
        throw new UnauthorizedException('Código expirado.');
      }

      await em.update(ImpersonationCode, found.id, { used: true });
      return found;
    });

    const membership = await this.membershipRepo.findOne({
      where: { tenantId: record.tenantId, role: UserRole.ADMIN, isActive: true },
    });
    if (!membership) throw new UnauthorizedException('Tenant sin usuario admin.');

    const privateKey = this.configService.get<string>('jwt.privateKey') ?? '';
    const accessExpiration = this.configService.get<string>('jwt.accessExpiration') ?? '15m';
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') ?? '7d';

    const payload = {
      sub: membership.userId,
      tenantId: record.tenantId,
      role: UserRole.ADMIN,
      isImpersonated: true,
      actorId: record.platformAdminId,
    };

    const accessToken = this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: accessExpiration as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshToken = this.jwtService.sign(
      { sub: membership.userId, tenantId: record.tenantId, type: 'impersonation-refresh' },
      { privateKey, algorithm: 'RS256', expiresIn: refreshExpiration as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );

    const base = this.merchantCookieBase;
    res.cookie('access-token', accessToken, { ...base, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh-token', refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('impersonation-active', '1', { ...base, maxAge: 15 * 60 * 1000 });

    return { tenantId: record.tenantId, role: UserRole.ADMIN, message: 'Sesión de impersonación iniciada.' };
  }

  async end(
    actorId: string,
    tenantId: string,
    ip: string,
    res: Response,
  ): Promise<{ message: string }> {
    const base = this.merchantCookieBase;
    res.clearCookie('access-token', base);
    res.clearCookie('refresh-token', base);
    res.clearCookie('impersonation-active', base);

    await this.auditRepo.save(
      this.auditRepo.create({
        actorId,
        action: AuditAction.IMPERSONATION_ENDED,
        onBehalfOfTenantId: tenantId,
        ipAddress: ip,
        details: null,
      }),
    );

    return { message: 'Sesión de impersonación cerrada.' };
  }

  async cleanExpiredCodes(): Promise<number> {
    const result = await this.codeRepo.delete({ expiresAt: LessThan(new Date()), used: false });
    return result.affected ?? 0;
  }
}
