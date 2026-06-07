import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource, QueryRunner } from 'typeorm';
import { Observable, from } from 'rxjs';
import { mergeMap, tap, catchError } from 'rxjs/operators';
import type { Request } from 'express';
import { SKIP_RLS_KEY } from '../decorators/skip-rls.decorator.js';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
}

interface RequestWithRls extends Request {
  user?: JwtPayload;
  rlsQueryRunner?: QueryRunner;
}

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSkipRls = this.reflector.getAllAndOverride<boolean>(SKIP_RLS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isSkipRls) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithRls>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('INVALID_TENANT_CONTEXT');
    }

    // Usamos mergeMap con from() para manejar el ciclo de vida asíncrono del QueryRunner en RxJS
    const queryRunner = this.dataSource.createQueryRunner();

    return from(
      queryRunner
        .connect()
        .then(() => queryRunner.startTransaction())
        .then(() =>
          queryRunner.query(
            "SELECT set_config('app.current_tenant_id', $1, true);",
            [tenantId],
          ),
        ),
    ).pipe(
      mergeMap(() => {
        request.rlsQueryRunner = queryRunner;
        return next.handle().pipe(
          mergeMap(async (result) => {
            try {
              await queryRunner.commitTransaction();
            } finally {
              await queryRunner.release();
            }
            return result;
          }),
          catchError(async (error) => {
            try {
              await queryRunner.rollbackTransaction();
            } finally {
              await queryRunner.release();
            }
            throw error;
          }),
        );
      }),
      catchError(async (error) => {
        // En caso de que falle connect, startTransaction o set_config inicial
        try {
          await queryRunner.rollbackTransaction();
        } catch {
          // Ignoramos si la transacción no había arrancado
        } finally {
          await queryRunner.release();
        }
        throw error;
      }),
    );
  }
}
