import { HttpException } from '@nestjs/common';
import type { ErrorDefinition } from './error-definition.js';

export class BusinessException extends HttpException {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(error: ErrorDefinition) {
    super(
      {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(error.details ? { details: error.details } : {}),
      },
      error.statusCode,
    );
    this.code = error.code;
    this.details = error.details;
  }
}

export function toBusinessException(error: ErrorDefinition): BusinessException {
  return new BusinessException(error);
}
