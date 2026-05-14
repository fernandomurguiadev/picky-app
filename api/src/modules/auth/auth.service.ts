import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Response } from 'express';

import { User, UserRole } from './entities/user.entity.js';
import { TenantMembership } from './entities/tenant-membership.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import { AuthErrors } from './errors/auth.errors.js';
import { toBusinessException } from '../../common/errors/business.exception.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(StoreSettings)
    private readonly storeSettingsRepo: Repository<StoreSettings>,
    @InjectRepository(TenantMembership)
    private readonly membershipRepo: Repository<TenantMembership>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const lowercaseEmail = dto.email.toLowerCase();
    const existingTenant = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    if (existingTenant) {
      throw toBusinessException(AuthErrors.slugInUse(dto.slug));
    }

    const existingUser = await this.userRepo.findOne({ where: { email: lowercaseEmail } });
    if (existingUser) {
      throw toBusinessException(AuthErrors.emailInUse(lowercaseEmail));
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = queryRunner.manager.create(Tenant, {
        slug: dto.slug,
        name: dto.storeName,
        isActive: true,
      });
      await queryRunner.manager.save(tenant);

      const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);
      const user = queryRunner.manager.create(User, {
        email: lowercaseEmail,
        passwordHash,
        role: UserRole.ADMIN,
      });
      await queryRunner.manager.save(user);

      const membership = queryRunner.manager.create(TenantMembership, {
        userId: user.id,
        tenantId: tenant.id,
        role: UserRole.ADMIN,
        isActive: true,
      });
      await queryRunner.manager.save(membership);

      const settings = queryRunner.manager.create(StoreSettings, {
        tenantId: tenant.id,
      });
      await queryRunner.manager.save(settings);

      await queryRunner.commitTransaction();

      const access_token = this.signAccessToken(user, tenant.id);
      return { access_token };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto, response: Response): Promise<
    | { access_token: string }
    | { requiresSelection: true; selectionToken: string; tenants: { id: string; name: string; slug: string }[] }
  > {
    const lowercaseEmail = dto.email.toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email: lowercaseEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    const isValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta deshabilitada.');
    }

    // Fetch all active memberships
    const memberships = await this.membershipRepo.find({
      where: { userId: user.id, isActive: true },
      relations: { tenant: true },
    });

    if (memberships.length === 0) {
      throw new UnauthorizedException('Usuario sin comercios activos vinculados.');
    }

    // Filter strictly active tenants
    const activeMemberships = memberships.filter((m) => m.tenant.isActive);

    if (activeMemberships.length === 0) {
      throw new UnauthorizedException('Todos tus comercios asociados están deshabilitados.');
    }

    // If single active shop, log in immediately
    if (activeMemberships.length === 1) {
      const membership = activeMemberships[0]!;
      const tenantId = membership.tenant.id;

      const refreshToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      // Store concatenated token to persist tenant context in standard session
      await this.userRepo.update(user.id, {
        refreshToken: `${tokenHash}:${tenantId}`,
      });

      const isProduction = this.configService.get('NODE_ENV') === 'production';
      response.cookie('refresh-token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { access_token: this.signAccessToken(user, tenantId) };
    }

    // Multiple active shops -> Return selection prompt with stateless selectionToken
    const tenantList = activeMemberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
    }));

    const selectionToken = this.signSelectionToken(user.id, user.email, tenantList);
    return {
      requiresSelection: true,
      selectionToken,
      tenants: tenantList,
    };
  }

  async selectTenant(
    selectionToken: string,
    tenantId: string,
    response: Response,
  ): Promise<{ access_token: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(selectionToken);
    } catch {
      throw new UnauthorizedException('Token de selección expirado o inválido.');
    }

    if (payload.purpose !== 'tenant_selection') {
      throw new UnauthorizedException('Acción no permitida.');
    }

    const userId = payload.sub;

    // Verify the membership and status
    const membership = await this.membershipRepo.findOne({
      where: { userId, tenantId, isActive: true },
      relations: { tenant: true, user: true },
    });

    if (!membership || !membership.tenant.isActive) {
      throw new UnauthorizedException('No tenés permisos para acceder a este comercio.');
    }

    const refreshToken = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    await this.userRepo.update(userId, {
      refreshToken: `${tokenHash}:${tenantId}`,
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    response.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: this.signAccessToken(membership.user, tenantId) };
  }

  async refresh(rawToken: string, response: Response): Promise<{ access_token: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Use Like operator to match token prefix since we appended tenantId metadata
    const { Like } = await import('typeorm');
    const matchedUser = await this.userRepo.findOne({
      where: {
        refreshToken: Like(`${tokenHash}:%`),
        isActive: true,
      },
      select: { id: true, role: true, refreshToken: true },
    });

    if (!matchedUser || !matchedUser.refreshToken) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const parts = matchedUser.refreshToken.split(':');
    const sessionTenantId = parts[1];

    if (!sessionTenantId) {
      throw new UnauthorizedException('Contexto de sesión corrupto o inválido.');
    }

    // Rotate token
    const newRaw = crypto.randomUUID();
    const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');
    
    await this.userRepo.update(matchedUser.id, {
      refreshToken: `${newHash}:${sessionTenantId}`,
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    response.cookie('refresh-token', newRaw, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: this.signAccessToken(matchedUser, sessionTenantId) };
  }

  async logout(userId: string, response: Response): Promise<{ message: string }> {
    await this.userRepo.update(userId, { refreshToken: null });
    response.clearCookie('refresh-token');
    return { message: 'ok' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const message = 'Si el email existe, recibirás un correo con instrucciones.';
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });

    if (!user) {
      return { message };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.userRepo.update(user.id, {
      resetPasswordToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
      resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    // TODO: enviar email con link de reset usando rawToken
    return { message };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const matchedUser = await this.userRepo.findOne({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiresAt: MoreThan(new Date()),
      },
    });

    if (!matchedUser) {
      throw toBusinessException(AuthErrors.invalidResetToken());
    }

    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    await this.userRepo.update(matchedUser.id, {
      passwordHash: await bcrypt.hash(dto.newPassword, bcryptRounds),
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    });

    return { message: 'Contraseña actualizada.' };
  }

  private signSelectionToken(
    userId: string,
    email: string,
    tenants: { id: string; name: string; slug: string }[],
  ): string {
    return this.jwtService.sign(
      { sub: userId, email, purpose: 'tenant_selection', tenants },
      { algorithm: 'RS256', expiresIn: '3m' },
    );
  }

  private signAccessToken(user: User, tenantId: string): string {
    return this.jwtService.sign(
      { sub: user.id, tenantId, role: user.role },
      { algorithm: 'RS256', expiresIn: this.configService.get('jwt.accessExpiration') ?? '15m' },
    );
  }
}
