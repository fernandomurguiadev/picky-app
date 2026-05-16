import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { QueryRunner } from 'typeorm';

interface RequestWithRls extends Request {
  rlsQueryRunner?: QueryRunner;
}

export const RlsRunner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): QueryRunner | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithRls>();
    return request.rlsQueryRunner;
  },
);
