import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { StoreSettings } from '../tenants/entities/store-settings.entity.js';
import { CommonErrors } from '../../common/errors/common.errors.js';
import { toBusinessException } from '../../common/errors/business.exception.js';

// A5 portrait in PDF points (72 dpi)
const PAGE_W = 419.5;
const PAGE_H = 595.3;
const CARD_MARGIN = 30;
const CARD_X = CARD_MARGIN;
const CARD_Y = CARD_MARGIN;
const CARD_W = PAGE_W - CARD_MARGIN * 2;
const CENTER_X = PAGE_W / 2;

const BW_PRIMARY = '#000000';
const BW_ACCENT = '#ffffff';

export interface FlyerOptions {
  includeLogo: boolean;
  useColors: boolean;
}

@Injectable()
export class QrFlyerService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(StoreSettings)
    private readonly settingsRepo: Repository<StoreSettings>,
  ) {}

  async generateFlyer(
    tenantId: string,
    options: FlyerOptions,
    runner?: QueryRunner,
  ): Promise<Buffer> {
    const tRepo = runner ? runner.manager.getRepository(Tenant) : this.tenantRepo;
    const sRepo = runner ? runner.manager.getRepository(StoreSettings) : this.settingsRepo;

    const tenant = await tRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw toBusinessException(CommonErrors.notFound('Store', { tenantId }));

    const settings = await sRepo.findOne({ where: { tenantId } });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const storeUrl = `${frontendUrl}/${tenant.slug}`;
    const primaryColor = options.useColors ? (settings?.primaryColor ?? BW_PRIMARY) : BW_PRIMARY;
    const accentColor = options.useColors ? (settings?.accentColor ?? BW_ACCENT) : BW_ACCENT;
    const storeName = tenant.name;
    const ctaText = settings?.customCtaText ?? '¡Escaneá y hacé tu pedido!';
    const logoUrl = options.includeLogo ? (settings?.logoUrl ?? null) : null;

    const [qrBuffer, logoBuffer] = await Promise.all([
      QRCode.toBuffer(storeUrl, {
        width: 400,
        margin: 2,
        color: { dark: primaryColor, light: '#ffffff' },
      }),
      logoUrl ? this.fetchImageBuffer(logoUrl) : Promise.resolve(null),
    ]);

    return this.renderPdf({
      storeName,
      ctaText,
      storeUrl,
      primaryColor,
      accentColor,
      qrBuffer,
      logoBuffer,
    });
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  private renderPdf(params: {
    storeName: string;
    ctaText: string;
    storeUrl: string;
    primaryColor: string;
    accentColor: string;
    qrBuffer: Buffer;
    logoBuffer: Buffer | null;
  }): Promise<Buffer> {
    const { storeName, ctaText, storeUrl, primaryColor, accentColor, qrBuffer, logoBuffer } =
      params;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 0 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Fondo exterior ──────────────────────────────────────────────────────
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(primaryColor);

      // ── Card interior ───────────────────────────────────────────────────────
      const cardH = PAGE_H - CARD_MARGIN * 2;
      doc.roundedRect(CARD_X, CARD_Y, CARD_W, cardH, 16).fill(accentColor);

      let y = CARD_Y + 28;

      // ── Logo ────────────────────────────────────────────────────────────────
      if (logoBuffer) {
        const logoSize = 72;
        try {
          doc.image(logoBuffer, CENTER_X - logoSize / 2, y, {
            width: logoSize,
            height: logoSize,
          });
          y += logoSize + 18;
        } catch {
          // Logo con formato no soportado — se omite
        }
      }

      // ── Nombre del comercio ─────────────────────────────────────────────────
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(22);
      doc.text(storeName, CARD_X + 16, y, { width: CARD_W - 32, align: 'center' });
      y += doc.heightOfString(storeName, { width: CARD_W - 32 }) + 18;

      // ── QR code ─────────────────────────────────────────────────────────────
      const qrSize = 200;
      doc.image(qrBuffer, CENTER_X - qrSize / 2, y, { width: qrSize, height: qrSize });
      y += qrSize + 22;

      // ── CTA ─────────────────────────────────────────────────────────────────
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(13);
      doc.text(ctaText, CARD_X + 16, y, { width: CARD_W - 32, align: 'center' });
      y += doc.heightOfString(ctaText, { width: CARD_W - 32 }) + 10;

      // ── URL hint ────────────────────────────────────────────────────────────
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9).opacity(0.55);
      doc.text(storeUrl, CARD_X + 16, y, { width: CARD_W - 32, align: 'center' });

      doc.end();
    });
  }
}
