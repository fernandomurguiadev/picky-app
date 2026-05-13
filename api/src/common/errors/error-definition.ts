import { HttpStatus } from '@nestjs/common';

export interface ErrorDefinition {
  statusCode: HttpStatus;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
