import { HttpStatus } from '@nestjs/common';
import type { ErrorDefinition } from '../../../common/errors/error-definition.js';
import { AuthErrorCodes } from './auth.error-codes.js';

export const AuthErrors = {
  slugInUse: (slug: string): ErrorDefinition => ({
    statusCode: HttpStatus.CONFLICT,
    code: AuthErrorCodes.SLUG_ALREADY_IN_USE,
    message: `El slug '${slug}' ya está en uso.`,
    details: { slug },
  }),

  emailInUse: (email: string): ErrorDefinition => ({
    statusCode: HttpStatus.CONFLICT,
    code: AuthErrorCodes.EMAIL_ALREADY_IN_USE,
    message: `El email '${email}' ya está registrado.`,
    details: { email },
  }),

  invalidResetToken: (): ErrorDefinition => ({
    statusCode: HttpStatus.BAD_REQUEST,
    code: AuthErrorCodes.INVALID_RESET_TOKEN,
    message: 'Token de reset inválido o expirado.',
  }),
};
