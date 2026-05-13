import { HttpStatus } from '@nestjs/common';
import type { ErrorDefinition } from './error-definition.js';

export const CommonErrors = {
  notFound(entity: string, context?: Record<string, unknown>): ErrorDefinition {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: `${entity.toUpperCase()}.NOT_FOUND`,
      message: `${entity} no encontrado.`,
      ...(context ? { details: context } : {}),
    };
  },

  forbidden(reason?: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      code: 'COMMON.FORBIDDEN',
      message: reason ?? 'No tenés permiso para realizar esta acción.',
    };
  },

  conflict(entity: string, field: string, value: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: `${entity.toUpperCase()}.ALREADY_EXISTS`,
      message: `Ya existe un ${entity} con ${field} '${value}'.`,
      details: { field, value },
    };
  },
};
