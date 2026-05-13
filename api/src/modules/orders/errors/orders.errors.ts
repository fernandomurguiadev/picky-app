import { HttpStatus } from '@nestjs/common';
import type { ErrorDefinition } from '../../../common/errors/error-definition.js';
import { OrderErrorCodes } from './orders.error-codes.js';

export const OrderErrors = {
  notFound: (id: string): ErrorDefinition => ({
    statusCode: HttpStatus.NOT_FOUND,
    code: OrderErrorCodes.ORDER_NOT_FOUND,
    message: `Pedido ${id} no encontrado.`,
  }),

  forbidden: (id: string): ErrorDefinition => ({
    statusCode: HttpStatus.FORBIDDEN,
    code: OrderErrorCodes.ORDER_FORBIDDEN,
    message: `No tenés acceso al pedido ${id}.`,
  }),

  invalidTransition: (from: string, to: string): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.INVALID_STATUS_TRANSITION,
    message: `Transición de estado inválida: ${from} → ${to}.`,
  }),

  deliveryNotEnabled: (): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.DELIVERY_NOT_ENABLED,
    message: 'El envío a domicilio no está habilitado para esta tienda.',
  }),

  takeawayNotEnabled: (): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.TAKEAWAY_NOT_ENABLED,
    message: 'El retiro en local no está habilitado para esta tienda.',
  }),

  inStoreNotEnabled: (): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.IN_STORE_NOT_ENABLED,
    message: 'El consumo en local no está habilitado para esta tienda.',
  }),

  paymentNotEnabled: (method: string): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.PAYMENT_METHOD_NOT_ENABLED,
    message: `El método de pago "${method}" no está habilitado para esta tienda.`,
  }),

  belowMinimumOrder: (minCents: number, actualCents: number): ErrorDefinition => ({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    code: OrderErrorCodes.BELOW_MINIMUM_ORDER,
    message: `El subtotal ($${(actualCents / 100).toFixed(2)}) no alcanza el mínimo para envío ($${(minCents / 100).toFixed(2)}).`,
    details: { minimumCents: minCents, actualCents },
  }),

  settingsNotFound: (tenantId: string): ErrorDefinition => ({
    statusCode: HttpStatus.NOT_FOUND,
    code: OrderErrorCodes.TENANT_SETTINGS_NOT_FOUND,
    message: `No se encontró la configuración de la tienda ${tenantId}.`,
  }),
};
