import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';

import { CommonErrors } from '../../common/errors/common.errors.js';
import { toBusinessException } from '../../common/errors/business.exception.js';
import { Tenant } from './entities/tenant.entity.js';
import { StoreSettings } from './entities/store-settings.entity.js';
import type { DaySchedule } from './interfaces/schedule.interface.js';
import type { UpdateStoreSettingsDto } from './dto/update-store-settings.dto.js';

export interface StoreStatusResult {
  isOpen: boolean;
  nextChange: string | null;
  source: 'manual' | 'schedule';
  todaySchedule?: DaySchedule | null;
}

export type StoreSettingsResponse = Omit<StoreSettings, 'tenant'> & {
  tenant: Pick<Tenant, 'id' | 'name' | 'slug' | 'isActive'> | null;
};

// ─── Helpers de timezone ──────────────────────────────────────────────────

function getCurrentTimeInTz(timezone: string): { day: string; time: string } {
  const safeTimezone = (() => {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    } catch {
      return 'UTC';
    }
  })();

  const now = new Date();
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: safeTimezone,
  })
    .format(now)
    .toLowerCase();

  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: safeTimezone,
  }).format(now);

  return { day, time };
}

function calcStoreStatus(
  schedule: DaySchedule[] | null,
  timezone: string,
): Omit<StoreStatusResult, 'source'> {
  if (!schedule || schedule.length === 0) {
    return { isOpen: false, nextChange: null };
  }

  const { day, time } = getCurrentTimeInTz(timezone);
  const today = schedule.find((d) => d.day === day);

  if (!today || !today.isOpen || today.shifts.length === 0) {
    return { isOpen: false, nextChange: null };
  }

  for (const shift of today.shifts) {
    if (time >= shift.open && time <= shift.close) {
      return { isOpen: true, nextChange: shift.close };
    }
    if (time < shift.open) {
      return { isOpen: false, nextChange: shift.open };
    }
  }

  return { isOpen: false, nextChange: null };
}

// ─── Service ──────────────────────────────────────────────────────────────

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(StoreSettings)
    private readonly settingsRepo: Repository<StoreSettings>,
  ) {}

  /** B3.1 — Resolución mínima de tenantId por slug (sin joins) */
  async getTenantId(slug: string): Promise<{ tenantId: string }> {
    const tenant = await this.tenantRepo.findOne({
      where: { slug },
      select: { id: true },
    });
    if (!tenant)
      throw toBusinessException(CommonErrors.notFound('Store', { slug }));
    return { tenantId: tenant.id };
  }

  /** B3.2 — Datos públicos del comercio para la tienda pública */
  async getPublicStore(slug: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!tenant)
      throw toBusinessException(CommonErrors.notFound('Store', { slug }));

    const settings = await this.settingsRepo.findOne({
      where: { tenantId: tenant.id },
    });

    return {
      id: tenant.id,
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: settings?.description ?? null,
      logoUrl: settings?.logoUrl ?? null,
      phone: settings?.phone ?? null,
      whatsapp: settings?.whatsapp ?? null,
      address: settings?.address ?? null,
      theme: {
        primaryColor: settings?.primaryColor ?? '#000000',
        accentColor: settings?.accentColor ?? '#ffffff',
        backgroundColor: settings?.backgroundColor ?? '#ffffff',
        cardStyle: settings?.cardStyle ?? 'default',
        mobileGridCols: (settings?.mobileGridCols ?? 2) as 0 | 1 | 2,
      },
      deliveryEnabled: settings?.deliveryEnabled ?? false,
      deliveryCost: settings?.deliveryCost ?? 0,
      deliveryMinOrder: settings?.deliveryMinOrder ?? 0,
      takeawayEnabled: settings?.takeawayEnabled ?? true,
      inStoreEnabled: settings?.inStoreEnabled ?? false,
      cashEnabled: settings?.cashEnabled ?? true,
      transferEnabled: settings?.transferEnabled ?? false,
      cardEnabled: settings?.cardEnabled ?? false,
      transferAlias: settings?.transferAlias ?? null,
    };
  }

  /** B3.3 — Estado abierto/cerrado calculado con timezone del tenant */
  async getStoreStatus(slug: string): Promise<StoreStatusResult> {
    const tenant = await this.tenantRepo.findOne({
      where: { slug, isActive: true },
    });
    if (!tenant)
      throw toBusinessException(CommonErrors.notFound('Store', { slug }));

    const settings = await this.settingsRepo.findOne({
      where: { tenantId: tenant.id },
      select: { schedule: true, timezone: true, isManualOpen: true },
    });

    const tz = settings?.timezone ?? 'America/Argentina/Buenos_Aires';
    const { day } = getCurrentTimeInTz(tz);
    const todaySchedule =
      settings?.schedule?.find((d) => d.day === day) ?? null;

    if (settings?.isManualOpen === true) {
      return {
        isOpen: true,
        nextChange: null,
        source: 'manual',
        todaySchedule,
      };
    }
    if (settings?.isManualOpen === false) {
      return {
        isOpen: false,
        nextChange: null,
        source: 'manual',
        todaySchedule,
      };
    }

    return {
      ...calcStoreStatus(settings?.schedule ?? null, tz),
      source: 'schedule',
      todaySchedule,
    };
  }

  /** B3.4 — Configuración completa del tenant autenticado (lazy-init si no existe) */
  async getMySettings(
    tenantId: string,
    runner?: QueryRunner,
  ): Promise<StoreSettingsResponse | null> {
    if (!tenantId) return null;

    const repo = runner
      ? runner.manager.getRepository(StoreSettings)
      : this.settingsRepo;
    let settings = await repo.findOne({
      where: { tenantId: tenantId },
      relations: ['tenant'],
    });

    if (!settings) {
      settings = await repo.save(repo.create({ tenantId }));
      settings = await repo.findOne({
        where: { tenantId: tenantId },
        relations: ['tenant'],
      });
    }

    if (!settings) return null;

    // Rompemos la referencia circular para evitar el 500 en la serialización JSON
    const { tenant, ...rest } = settings;
    return {
      ...rest,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            isActive: tenant.isActive,
          }
        : null,
    };
  }

  /** B3.5 — Upsert de StoreSettings (crea si no existe) */
  async updateMySettings(
    tenantId: string,
    dto: UpdateStoreSettingsDto,
    runner?: QueryRunner,
  ): Promise<StoreSettingsResponse | null> {
    const repo = runner
      ? runner.manager.getRepository(StoreSettings)
      : this.settingsRepo;

    let settings = await repo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      settings = repo.create({ tenantId, ...dto });
    } else {
      Object.assign(settings, dto);
    }

    await repo.save(settings);
    return this.getMySettings(tenantId, runner);
  }

  /** B8 — Override manual de apertura/cierre (null = volver al horario) */
  async toggleStoreStatus(
    tenantId: string,
    isManualOpen: boolean | null,
    runner?: QueryRunner,
  ): Promise<StoreSettingsResponse | null> {
    const repo = runner
      ? runner.manager.getRepository(StoreSettings)
      : this.settingsRepo;
    let settings = await repo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      settings = repo.create({ tenantId, isManualOpen });
    } else {
      settings.isManualOpen = isManualOpen;
    }

    await repo.save(settings);
    return this.getMySettings(tenantId, runner);
  }
}
