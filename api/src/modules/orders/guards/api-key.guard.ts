import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-api-key'];
    const expected = this.config.get<string>('WEBHOOK_API_KEY');

    if (!expected || typeof provided !== 'string') {
      throw new UnauthorizedException('Missing API key');
    }

    const match = crypto.timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected),
    );

    if (!match) throw new UnauthorizedException('Invalid API key');
    return true;
  }
}
