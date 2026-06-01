import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { TenantMembership } from '../modules/auth/entities/tenant-membership.entity.js';
import { UserRole } from '../modules/auth/entities/user.entity.js';
import { Category } from '../modules/catalog/entities/category.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

const TENANT_ID = 'c4b18428-2321-4d32-aa7a-241517441cb2'; // Fijo
const USER_ID = '71c45967-4651-4059-b8bd-acc2eca1049b';

async function seedTenantElectronics() {
  console.log('🚀 Iniciando setup del nuevo tenant de ELECTRÓNICA & GADGETS...');

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // 1. Obtener o crear el Tenant
    let tenant = await AppDataSource.getRepository(Tenant).findOne({ where: { id: TENANT_ID } });
    if (!tenant) {
      console.log('🔌 Creando nuevo Tenant "Picky Tech"...');
      tenant = await AppDataSource.getRepository(Tenant).save(
        AppDataSource.getRepository(Tenant).create({
          id: TENANT_ID,
          name: 'Picky Tech Store',
          slug: 'picky-tech',
          isActive: true
        })
      );
    } else {
      console.log('✅ Tenant existente encontrado:', tenant.name);
    }

    // RLS compatible session
    await queryRunner.query(`SELECT set_config('app.current_tenant_id', $1, false)`, [tenant.id]);

    // 2. Crear StoreSettings si no existen
    let settings = await AppDataSource.getRepository(StoreSettings).findOne({ where: { tenantId: tenant.id } });
    if (!settings) {
      console.log('⚙️ Creando StoreSettings corporativas...');
      settings = await AppDataSource.getRepository(StoreSettings).save(
        AppDataSource.getRepository(StoreSettings).create({
          tenantId: tenant.id,
          description: 'Especialistas en gadgets importados, hardware de vanguardia y lo último en sonido de alta definición.',
          phone: '5491144444444',
          whatsapp: '5491144444444',
          address: 'Av. Corrientes 2400, CABA',
          primaryColor: '#3B82F6', // Azul Tech / Cyber
          accentColor: '#10B981',
          backgroundColor: '#0F172A', // Fondo oscuro premium
          deliveryEnabled: true,
          deliveryCost: 150000,
          deliveryMinOrder: 1000000,
          takeawayEnabled: true,
          cashEnabled: true,
          transferEnabled: true,
          transferAlias: 'picky.tech.mp'
        })
      );
    }

    // 3. Crear membresía para vincular el ID de usuario provisto
    const membershipRepo = AppDataSource.getRepository(TenantMembership);
    const existingMembership = await membershipRepo.findOne({
      where: { userId: USER_ID, tenantId: tenant.id }
    });

    if (!existingMembership) {
      console.log(`🔗 Vinculando membresía ADMIN para el usuario ${USER_ID}...`);
      await membershipRepo.save(
        membershipRepo.create({
          userId: USER_ID,
          tenantId: tenant.id,
          role: UserRole.ADMIN,
          isActive: true
        })
      );
    } else {
      console.log('✅ Membresía de administrador ya existe.');
    }

    // 4. CATEGORÍAS (Adición desde cero)
    console.log('\n🔌 Insertando categorías de Tecnología...');
    const catSmartphones = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Celulares y Tablets', order: 1 })
    );
    const catAudio = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Audio de Alta Fidelidad', order: 2 })
    );
    const catComputing = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Computadoras y Notebooks', order: 3 })
    );
    const catGaming = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Mundo Gaming & Consolas', order: 4 })
    );
    const catSmartHome = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Smart Home & Drones', order: 5 })
    );

    // 5. PRODUCTOS (Mega catálogo de tecnología)
    console.log('\n🔌 Insertando catálogo completo de productos tecnológicos...');
    await AppDataSource.getRepository(Product).save([
      // Celulares y Tablets
      {
        tenantId: tenant.id, categoryId: catSmartphones.id, order: 1, isFeatured: true, isActive: true,
        name: 'Smartphone Pro 256GB Platinum', price: 125000000,
        description: 'Pantalla AMOLED de 120Hz, triple cámara de 50MP, procesador de 4nm con IA integrada.'
      },
      {
        tenantId: tenant.id, categoryId: catSmartphones.id, order: 2, isFeatured: false, isActive: true,
        name: 'Tablet Creator 11" Wifi', price: 68900000,
        description: 'Pantalla de 11 pulgadas ultra fluida, 128GB de almacenamiento y soporte para stylus activo.'
      },
      {
        tenantId: tenant.id, categoryId: catSmartphones.id, order: 3, isFeatured: false, isActive: true,
        name: 'Cargador de pared GaN 65W', price: 4500000,
        description: 'Carga rápida compacta con tecnología de nitruro de galio. Tres puertos inteligentes.'
      },
      // Audio
      {
        tenantId: tenant.id, categoryId: catAudio.id, order: 1, isFeatured: true, isActive: true,
        name: 'Auriculares Over-Ear ANC Studio', price: 34990000,
        description: 'Cancelación activa de ruido inteligente, audio espacial adaptativo y 40 horas de reproducción.'
      },
      {
        tenantId: tenant.id, categoryId: catAudio.id, order: 2, isFeatured: false, isActive: true,
        name: 'Parlante Bluetooth WaterProof 30W', price: 21500000,
        description: 'Resistente al agua y al polvo IP67, doble radiador pasivo y hasta 15 horas de batería.'
      },
      // Computadoras
      {
        tenantId: tenant.id, categoryId: catComputing.id, order: 1, isFeatured: true, isActive: true,
        name: 'Notebook Ultra Slim 14"', price: 189000000,
        description: 'Procesador de última generación, 16GB RAM LPDDR5, 512GB SSD NVMe. Chasis de aluminio aeroespacial.'
      },
      {
        tenantId: tenant.id, categoryId: catComputing.id, order: 2, isFeatured: false, isActive: true,
        name: 'Monitor Oficina Curvo 27"', price: 54900000,
        description: 'Resolución QHD (2560x1440) de 75Hz con protección ocular frente a luz azul.'
      },
      // Gaming
      {
        tenantId: tenant.id, categoryId: catGaming.id, order: 1, isFeatured: true, isActive: true,
        name: 'Consola Next-Gen 1TB SSD', price: 215000000,
        description: 'Juegos a 4K nativo y 120 FPS. Incluye un joystick inalámbrico de precisión.'
      },
      {
        tenantId: tenant.id, categoryId: catGaming.id, order: 2, isFeatured: false, isActive: true,
        name: 'Joystick Inalámbrico Chameleon', price: 24500000,
        description: 'Gatillos dinámicos de resistencia variable y retroalimentación háptica inmersiva.'
      },
      // Smart Home
      {
        tenantId: tenant.id, categoryId: catSmartHome.id, order: 1, isFeatured: true, isActive: true,
        name: 'Cámara de Seguridad Wifi 360°', price: 13900000,
        description: 'Grabación en resolución 2K, visión nocturna infrarroja y detección inteligente de movimiento.'
      }
    ].map(p => AppDataSource.getRepository(Product).create(p)));

    console.log('\n✨ ¡Configuración y catálogo de Electrónica inyectados con éxito!');
    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedTenantElectronics();
