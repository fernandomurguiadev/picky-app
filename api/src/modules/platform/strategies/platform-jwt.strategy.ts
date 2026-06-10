import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface PlatformJwtPayload {
  sub: string;
  email: string;
  type: 'platform-access';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedPlatformAdmin {
  platformAdminId: string;
  email: string;
}

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(configService: ConfigService) {
    const publicKey = configService.get<string>('platformJwt.publicKey');
    if (!publicKey) throw new Error('platformJwt.publicKey no configurado');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.cookies?.['platform-access-token'] as string | undefined) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  validate(payload: PlatformJwtPayload): AuthenticatedPlatformAdmin {
    return {
      platformAdminId: payload.sub,
      email: payload.email,
    };
  }
}
