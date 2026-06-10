import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source.js';
import { PlatformAdmin } from '../modules/platform/entities/platform-admin.entity.js';

async function seedPlatformAdmin() {
  const email = process.env['PLATFORM_ADMIN_EMAIL'];
  const password = process.env['PLATFORM_ADMIN_PASSWORD'];

  if (!email || !password) {
    console.error('PLATFORM_ADMIN_EMAIL y PLATFORM_ADMIN_PASSWORD son requeridos en el .env');
    process.exit(1);
  }

  console.log('Iniciando seed de PlatformAdmin...');

  try {
    await AppDataSource.initialize();
    console.log('Conexión establecida.');

    const repo = AppDataSource.getRepository(PlatformAdmin);
    const existing = await repo.findOne({ where: { email } });

    if (existing) {
      console.log(`PlatformAdmin con email "${email}" ya existe. Sin cambios.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await repo.save(
      repo.create({
        email,
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        isMfaEnabled: false,
        lockedAt: null,
        totpSecret: null,
      }),
    );

    console.log(`PlatformAdmin creado: ${email}`);
    console.log('Seed de PlatformAdmin completado.');
  } catch (error) {
    console.error('Error durante seed de PlatformAdmin:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seedPlatformAdmin();
