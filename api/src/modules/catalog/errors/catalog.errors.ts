import { HttpStatus } from '@nestjs/common';
import type { ErrorDefinition } from '../../../common/errors/error-definition.js';
import { CatalogErrorCodes } from './catalog.error-codes.js';

export const CatalogErrors = {
  categoryNotFound(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: CatalogErrorCodes.CATEGORY_NOT_FOUND,
      message: `Categoría ${id} no encontrada.`,
      details: { id },
    };
  },

  categoryForbidden(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      code: CatalogErrorCodes.CATEGORY_FORBIDDEN,
      message: `No tenés permiso para operar sobre la categoría ${id}.`,
      details: { id },
    };
  },

  categoryHasActiveProducts(id: string, count: number): ErrorDefinition {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: CatalogErrorCodes.CATEGORY_HAS_ACTIVE_PRODUCTS,
      message: `La categoría tiene ${count} producto(s) activo(s) y no puede eliminarse.`,
      details: { id, activeProducts: count },
    };
  },

  productNotFound(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: CatalogErrorCodes.PRODUCT_NOT_FOUND,
      message: `Producto ${id} no encontrado.`,
      details: { id },
    };
  },

  productForbidden(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      code: CatalogErrorCodes.PRODUCT_FORBIDDEN,
      message: `No tenés permiso para operar sobre el producto ${id}.`,
      details: { id },
    };
  },

  productHasActiveOrders(id: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: CatalogErrorCodes.PRODUCT_HAS_ACTIVE_ORDERS,
      message: `El producto tiene órdenes activas y no puede eliminarse.`,
      details: { id },
    };
  },

  tenantNotFound(slug: string): ErrorDefinition {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: CatalogErrorCodes.TENANT_NOT_FOUND,
      message: `Tienda '${slug}' no encontrada.`,
      details: { slug },
    };
  },

  reorderForbidden(): ErrorDefinition {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      code: CatalogErrorCodes.REORDER_FORBIDDEN,
      message: 'Uno o más IDs no pertenecen a tu tenant.',
    };
  },
};
