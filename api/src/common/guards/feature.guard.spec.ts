import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { FeatureGuard, FEATURE_KEY } from './feature.guard.js';
import { FeatureService } from '../../modules/platform/feature.service.js';

function makeContext(role: string | undefined, tenantId: string | undefined): ExecutionContext {
  const handler = {};
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role || tenantId ? { role, tenantId } : undefined }),
    }),
    getHandler: () => handler,
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('FeatureGuard', () => {
  let guard: FeatureGuard;
  const mockReflector = { getAllAndOverride: jest.fn() };
  const mockFeatureService = { hasFeature: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        FeatureGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: FeatureService, useValue: mockFeatureService },
      ],
    }).compile();

    guard = module.get(FeatureGuard);
  });

  it('pasa cuando la ruta no tiene @RequireFeature', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeContext('admin', 'tenant-a');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockFeatureService.hasFeature).not.toHaveBeenCalled();
  });

  it('bloquea (fail-closed) cuando no hay tenantId en el request', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('ANALYTICS');
    const ctx = makeContext('admin', undefined);
    await expect(guard.canActivate(ctx)).resolves.toBe(false);
    expect(mockFeatureService.hasFeature).not.toHaveBeenCalled();
  });

  it('delega en FeatureService.hasFeature con el tenantId y el código correctos', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('ANALYTICS');
    mockFeatureService.hasFeature.mockResolvedValue(true);
    const ctx = makeContext('admin', 'tenant-a');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockFeatureService.hasFeature).toHaveBeenCalledWith('tenant-a', 'ANALYTICS');
  });

  it('bloquea cuando el tenant no tiene el feature en su plan', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('ANALYTICS');
    mockFeatureService.hasFeature.mockResolvedValue(false);
    const ctx = makeContext('admin', 'tenant-a');

    await expect(guard.canActivate(ctx)).resolves.toBe(false);
  });

  it('lee tenantId de request.user.tenantId, no de request.tenantId (Guards corren antes que TenantContextInterceptor)', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('ANALYTICS');
    mockFeatureService.hasFeature.mockResolvedValue(true);
    // request.tenantId (seteado por el interceptor) todavía no existe en este punto
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin', tenantId: 'tenant-a' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);
    expect(mockFeatureService.hasFeature).toHaveBeenCalledWith('tenant-a', 'ANALYTICS');
  });
});
