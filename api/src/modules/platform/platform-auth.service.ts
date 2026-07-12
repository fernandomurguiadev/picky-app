import {
  Injectable,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import type { Response } from 'express';

import { PlatformAdmin } from './entities/platform-admin.entity.js';
import { PlatformAuditLog, AuditAction } from './entities/platform-audit-log.entity.js';
import type { PlatformLoginDto } from './dto/platform-login.dto.js';
import type { PlatformMfaVerifyDto, PlatformMfaConfirmDto } from './dto/platform-mfa.dto.js';

const MAX_FAILED_ATTEMPTS = 10;
const COOKIE_ACCESS = 'platform-access-token';
const COOKIE_REFRESH = 'platform-refresh-token';
const COOKIE_MFA_PENDING = 'platform-mfa-pending';

@Injectable()
export class PlatformAuthService {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    @InjectRepository(PlatformAdmin)
    private readonly adminRepo: Repository<PlatformAdmin>,
    @InjectRepository(PlatformAuditLog)
    private readonly auditRepo: Repository<PlatformAuditLog>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Cookie helpers ───────────────────────────────────────────────────────

  private get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  private get cookieBase() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict' as const,
    };
  }

  private setAccessCookie(res: Response, token: string): void {
    res.cookie(COOKIE_ACCESS, token, { ...this.cookieBase, maxAge: 15 * 60 * 1000 });
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(COOKIE_REFRESH, token, { ...this.cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private setMfaPendingCookie(res: Response, token: string): void {
    res.cookie(COOKIE_MFA_PENDING, token, { ...this.cookieBase, maxAge: 5 * 60 * 1000 });
  }

  private clearCookies(res: Response): void {
    res.clearCookie(COOKIE_ACCESS, this.cookieBase);
    res.clearCookie(COOKIE_REFRESH, this.cookieBase);
  }

  private clearMfaPendingCookie(res: Response): void {
    res.clearCookie(COOKIE_MFA_PENDING, this.cookieBase);
  }

  // ─── Token helpers ────────────────────────────────────────────────────────

  private issueAccessToken(admin: PlatformAdmin): string {
    return this.jwtService.sign(
      { sub: admin.id, email: admin.email, type: 'platform-access' },
      {
        privateKey: this.configService.get<string>('platformJwt.privateKey'),
        algorithm: 'RS256',
        expiresIn: (this.configService.get<string>('platformJwt.accessExpiration') ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  private issueRefreshToken(admin: PlatformAdmin): string {
    return this.jwtService.sign(
      { sub: admin.id, type: 'platform-refresh' },
      {
        privateKey: this.configService.get<string>('platformJwt.privateKey'),
        algorithm: 'RS256',
        expiresIn: (this.configService.get<string>('platformJwt.refreshExpiration') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  private issueMfaPendingToken(adminId: string): string {
    return this.jwtService.sign(
      { sub: adminId, type: 'platform-mfa-pending' },
      {
        privateKey: this.configService.get<string>('platformJwt.privateKey'),
        algorithm: 'RS256',
        expiresIn: '5m',
      },
    );
  }

  // ─── Encryption helpers (TOTP secret) ────────────────────────────────────

  private encryptTotp(secret: string): string {
    const key = this.configService.get<string>('platformJwt.mfaEncryptionKey') ?? '';
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decryptTotp(encrypted: string): string {
    const key = this.configService.get<string>('platformJwt.mfaEncryptionKey') ?? '';
    const keyBuffer = Buffer.from(key.padEnd(32).slice(0, 32));
    const [ivHex, encHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex!, 'hex');
    const enc = Buffer.from(encHex!, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }

  // ─── Audit helper ─────────────────────────────────────────────────────────

  private async audit(
    actorId: string,
    action: AuditAction,
    ipAddress?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditRepo.save(
      this.auditRepo.create({ actorId, action, ipAddress: ipAddress ?? null, details: details ?? null }),
    );
  }

  // ─── Email notification ───────────────────────────────────────────────────

  private notifyLogin(email: string, ip: string, _userAgent: string): void {
    // TODO: implement via nodemailer / @nestjs-modules/mailer
    const redactedIp = ip.replace(/\.\d+$/, '.***');
    this.logger.log(`Platform login: ${email} from ${redactedIp}`);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(
    dto: PlatformLoginDto,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<{ mfaRequired: true } | { email: string; message: string }> {
    const admin = await this.adminRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      select: ['id', 'email', 'passwordHash', 'isActive', 'failedLoginAttempts', 'isMfaEnabled', 'totpSecret'],
    });

    const fail = async (adminId?: string) => {
      if (adminId) {
        const current = await this.adminRepo.findOne({ where: { id: adminId } });
        if (current) {
          const attempts = (current.failedLoginAttempts ?? 0) + 1;
          const updates: Partial<PlatformAdmin> = { failedLoginAttempts: attempts };
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            updates.isActive = false;
            updates.lockedAt = new Date();
          }
          await this.adminRepo.update(adminId, updates);
          await this.audit(adminId, AuditAction.PLATFORM_LOGIN_FAILED, ip, { email: dto.email });
        }
      }
      throw new UnauthorizedException('Credenciales inválidas.');
    };

    if (!admin) return fail();
    if (!admin.isActive) throw new ForbiddenException('Cuenta bloqueada. Contactar soporte.');

    const validPassword = await bcrypt.compare(dto.password, admin.passwordHash ?? '');
    if (!validPassword) return fail(admin.id);

    await this.adminRepo.update(admin.id, { failedLoginAttempts: 0, lockedAt: null });

    if (admin.isMfaEnabled) {
      const mfaPendingToken = this.issueMfaPendingToken(admin.id);
      this.setMfaPendingCookie(res, mfaPendingToken);
      return { mfaRequired: true };
    }

    await this.issueSession(admin, ip, userAgent, res);
    return { email: admin.email, message: 'Login exitoso.' };
  }

  // ─── MFA verify (segundo paso) ────────────────────────────────────────────

  async verifyMfa(
    mfaPendingToken: string,
    dto: PlatformMfaVerifyDto,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<{ message: string }> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(mfaPendingToken, {
        publicKey: this.configService.get<string>('platformJwt.publicKey'),
        algorithms: ['RS256'],
      }) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('Token MFA inválido o expirado.');
    }

    if (payload.type !== 'platform-mfa-pending') {
      throw new UnauthorizedException('Token inválido.');
    }

    const admin = await this.adminRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'totpSecret', 'isActive'],
    });

    if (!admin || !admin.isActive || !admin.totpSecret) {
      throw new UnauthorizedException('Cuenta no válida.');
    }

    const secret = this.decryptTotp(admin.totpSecret);
    if (!this.validateTotp(secret, dto.totpCode)) {
      throw new UnauthorizedException('Código TOTP inválido.');
    }

    this.clearMfaPendingCookie(res);
    await this.issueSession(admin, ip, userAgent, res);
    return { message: 'Login con MFA exitoso.' };
  }

  // ─── MFA setup ────────────────────────────────────────────────────────────

  async setupMfa(adminId: string): Promise<{ qrCodeUrl: string }> {
    const admin = await this.adminRepo.findOneOrFail({ where: { id: adminId } });

    const secret = generateSecret();
    const encryptedSecret = this.encryptTotp(secret);
    await this.adminRepo.update(adminId, { totpSecret: encryptedSecret });

    const otpAuthUrl = generateURI({ secret, label: admin.email, issuer: 'PickyAdmin' });
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    return { qrCodeUrl };
  }

  async confirmMfa(adminId: string, dto: PlatformMfaConfirmDto): Promise<{ message: string }> {
    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
      select: ['id', 'totpSecret'],
    });
    if (!admin?.totpSecret) throw new UnauthorizedException('Setup MFA no iniciado.');

    const secret = this.decryptTotp(admin.totpSecret);
    if (!this.validateTotp(secret, dto.totpCode)) {
      throw new UnauthorizedException('Código TOTP inválido.');
    }

    await this.adminRepo.update(adminId, { isMfaEnabled: true });
    return { message: 'MFA activado correctamente.' };
  }

  private validateTotp(secret: string, token: string): boolean {
    return verifySync({ token, secret }).valid;
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(refreshToken: string, res: Response): Promise<{ message: string }> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        publicKey: this.configService.get<string>('platformJwt.publicKey'),
        algorithms: ['RS256'],
      }) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (payload.type !== 'platform-refresh') throw new UnauthorizedException('Token inválido.');

    const admin = await this.adminRepo.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'isActive', 'refreshTokenHash'],
    });
    if (!admin || !admin.isActive) throw new UnauthorizedException();

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (admin.refreshTokenHash !== tokenHash) throw new UnauthorizedException('Token revocado.');

    const newAccess = this.issueAccessToken(admin);
    const newRefresh = this.issueRefreshToken(admin);
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');

    await this.adminRepo.update(admin.id, { refreshTokenHash: newHash });
    this.setAccessCookie(res, newAccess);
    this.setRefreshCookie(res, newRefresh);

    return { message: 'Token renovado.' };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(adminId: string, ip: string, res: Response): Promise<{ message: string }> {
    await this.adminRepo.update(adminId, { refreshTokenHash: null });
    await this.audit(adminId, AuditAction.PLATFORM_LOGOUT, ip);
    this.clearCookies(res);
    return { message: 'Sesión cerrada.' };
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private async issueSession(
    admin: PlatformAdmin,
    ip: string,
    userAgent: string,
    res: Response,
  ): Promise<void> {
    const accessToken = this.issueAccessToken(admin);
    const refreshToken = this.issueRefreshToken(admin);
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.adminRepo.update(admin.id, { refreshTokenHash: refreshHash });

    this.setAccessCookie(res, accessToken);
    this.setRefreshCookie(res, refreshToken);

    await this.audit(admin.id, AuditAction.PLATFORM_LOGIN, ip);
    this.notifyLogin(admin.email, ip, userAgent);
  }
}
