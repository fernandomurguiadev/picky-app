import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { FeatureGuard } from '../../common/guards/feature.guard.js';
import { FeatureService } from '../platform/feature.service.js';
import { FeatureCode } from '../platform/enums/feature-code.enum.js';

/**
 * Simula el pipeline real de `@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)`
 * + `@Roles('admin')` + `@RequireFeature(FeatureCode.ANALYTICS)` de
 * ReportsController.getProfitability. JwtAuthGuard no se testea acá — se
 * asume que ya corrió y pobló `request.user`.
 */
function makeContext(user: { role: string; tenantId: string }): ExecutionContext {
  const handler = () => undefined;
  Reflect.defineMetadata('roles', ['admin'], handler);
  Reflect.defineMetadata('requiredFeature', FeatureCode.ANALYTICS, handler);
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => handler,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('ReportsController — control de acceso (RolesGuard + FeatureGuard)', () => {
  let rolesGuard: RolesGuard;
  let featureGuard: FeatureGuard;
  const mockFeatureService = { hasFeature: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const rolesModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useClass: Reflector }],
    }).compile();
    rolesGuard = rolesModule.get(RolesGuard);

    const featureModule = await Test.createTestingModule({
      providers: [
        FeatureGuard,
        { provide: Reflector, useClass: Reflector },
        { provide: FeatureService, useValue: mockFeatureService },
      ],
    }).compile();
    featureGuard = featureModule.get(FeatureGuard);
  });

  it('403 (RolesGuard) para un STAFF, sin llegar a consultar el feature', async () => {
    const ctx = makeContext({ role: 'staff', tenantId: 'tenant-a' });

    // RolesGuard.canActivate es síncrono — no devuelve Promise.
    expect(rolesGuard.canActivate(ctx)).toBe(false);
    expect(mockFeatureService.hasFeature).not.toHaveBeenCalled();
  });

  it('403 (FeatureGuard) para un ADMIN cuyo tenant no tiene ANALYTICS en el plan', async () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-a' });
    mockFeatureService.hasFeature.mockResolvedValue(false);

    expect(rolesGuard.canActivate(ctx)).toBe(true);
    await expect(featureGuard.canActivate(ctx)).resolves.toBe(false);
    expect(mockFeatureService.hasFeature).toHaveBeenCalledWith(
      'tenant-a',
      FeatureCode.ANALYTICS,
    );
  });

  it('200 — ADMIN con el feature ANALYTICS habilitado pasa ambos guards', async () => {
    const ctx = makeContext({ role: 'admin', tenantId: 'tenant-a' });
    mockFeatureService.hasFeature.mockResolvedValue(true);

    expect(rolesGuard.canActivate(ctx)).toBe(true);
    await expect(featureGuard.canActivate(ctx)).resolves.toBe(true);
  });
});
