import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}

// ─── Helpers de timezone ──────────────────────────────────────────────────

function getCurrentTimeInTz(timezone: string): { day: string; time: string } {
  const now = new Date();
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: timezone,
  })
    .format(now)
    .toLowerCase();

  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
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
    if (!tenant) throw toBusinessException(CommonErrors.notFound('Store', { slug }));
    return { tenantId: tenant.id };
  }

  /** B3.2 — Datos públicos del comercio para la tienda pública */
  async getPublicStore(slug: string) {
    const tenant = await this.tenantRepo.findOne({ where: { slug, isActive: true } });
    if (!tenant) throw toBusinessException(CommonErrors.notFound('Store', { slug }));

    const settings = await this.settingsRepo.findOne({ where: { tenantId: tenant.id } });
    
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
    const tenant = await this.tenantRepo.findOne({ where: { slug, isActive: true } });
    if (!tenant) throw toBusinessException(CommonErrors.notFound('Store', { slug }));

    const settings = await this.settingsRepo.findOne({
      where: { tenantId: tenant.id },
      select: { schedule: true, timezone: true, isManualOpen: true },
    });

    if (settings?.isManualOpen === true) {
      return { isOpen: true, nextChange: null, source: 'manual' };
    }
    if (settings?.isManualOpen === false) {
      return { isOpen: false, nextChange: null, source: 'manual' };
    }

    return {
      ...calcStoreStatus(
        settings?.schedule ?? null,
        settings?.timezone ?? 'America/Argentina/Buenos_Aires',
      ),
      source: 'schedule',
    };
  }

  /** B3.4 — Configuración completa del tenant autenticado */
  async getMySettings(tenantId: string): Promise<StoreSettings | null> {
    return this.settingsRepo.findOne({ 
      where: { tenantId },
      relations: ['tenant'],
    });
  }

  /** B3.5 — Upsert de StoreSettings (crea si no existe) */
  async updateMySettings(tenantId: string, dto: UpdateStoreSettingsDto): Promise<StoreSettings> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });

    if (!settings) {
      settings = this.settingsRepo.create({ tenantId, ...dto } as Partial<StoreSettings> & { tenantId: string });
    } else {
      Object.assign(settings, dto);
    }

    return this.settingsRepo.save(settings);
  }

  /** B8 — Override manual de apertura/cierre (null = volver al horario) */
  async toggleStoreStatus(
    tenantId: string,
    isManualOpen: boolean | null,
  ): Promise<{ isManualOpen: boolean | null }> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });

    if (!settings) {
      settings = this.settingsRepo.create({ tenantId, isManualOpen } as Partial<StoreSettings> & { tenantId: string });
    } else {
      settings.isManualOpen = isManualOpen;
    }

    await this.settingsRepo.save(settings);
    return { isManualOpen };
  }
}
