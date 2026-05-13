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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const existingTenant = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    if (existingTenant) {
      throw toBusinessException(AuthErrors.slugInUse(dto.slug));
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
        tenantId: tenant.id,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.ADMIN,
      });
      await queryRunner.manager.save(user);

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

  async login(dto: LoginDto, response: Response): Promise<{ access_token: string }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { tenant: true },
      select: {
        id: true,
        tenantId: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        tenant: { isActive: true },
      },
    });

    const isValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!user.isActive || !user.tenant.isActive) {
      throw new UnauthorizedException('Cuenta deshabilitada.');
    }

    const refreshToken = crypto.randomUUID();
    await this.userRepo.update(user.id, {
      refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    response.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: this.signAccessToken(user, user.tenantId) };
  }

  async refresh(rawToken: string, response: Response): Promise<{ access_token: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const matchedUser = await this.userRepo.findOne({
      where: { refreshToken: tokenHash, isActive: true },
      select: ['id', 'tenantId', 'role', 'refreshToken'],
    });

    if (!matchedUser) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    // Rotar refresh token
    const newRaw = crypto.randomUUID();
    await this.userRepo.update(matchedUser.id, {
      refreshToken: crypto.createHash('sha256').update(newRaw).digest('hex'),
    });

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    response.cookie('refresh-token', newRaw, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: this.signAccessToken(matchedUser, matchedUser.tenantId) };
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
    // await this.emailService.sendResetPassword(user.email, rawToken);

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

  private signAccessToken(user: User, tenantId: string): string {
    return this.jwtService.sign(
      { sub: user.id, tenantId, role: user.role },
      { algorithm: 'RS256', expiresIn: this.configService.get('jwt.accessExpiration') ?? '15m' },
    );
  }
}
