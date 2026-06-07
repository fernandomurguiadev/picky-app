import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { TenantMembership } from '../modules/auth/entities/tenant-membership.entity.js';
import { UserRole } from '../modules/auth/entities/user.entity.js';
import { Category } from '../modules/catalog/entities/category.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

const TENANT_ID = 'd4b18428-2321-4d32-aa7a-241517441cb3'; // Fijo
const USER_ID = '71c45967-4651-4059-b8bd-acc2eca1049b';

async function seedTenantTools() {
  console.log(
    '🚀 Iniciando setup del nuevo tenant de HERRAMIENTAS & FERRETERÍA...',
  );

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // 1. Obtener o crear el Tenant
    let tenant = await AppDataSource.getRepository(Tenant).findOne({
      where: { id: TENANT_ID },
    });
    if (!tenant) {
      console.log('🛠️ Creando nuevo Tenant "Picky Ferretería"...');
      tenant = await AppDataSource.getRepository(Tenant).save(
        AppDataSource.getRepository(Tenant).create({
          id: TENANT_ID,
          name: 'Picky Ferretería Industrial',
          slug: 'picky-ferreteria',
          isActive: true,
        }),
      );
    } else {
      console.log('✅ Tenant existente encontrado:', tenant.name);
    }

    // RLS compatible session
    await queryRunner.query(
      `SELECT set_config('app.current_tenant_id', $1, false)`,
      [tenant.id],
    );

    // 2. Crear StoreSettings si no existen
    let settings = await AppDataSource.getRepository(StoreSettings).findOne({
      where: { tenantId: tenant.id },
    });
    if (!settings) {
      console.log('⚙️ Creando StoreSettings corporativas...');
      settings = await AppDataSource.getRepository(StoreSettings).save(
        AppDataSource.getRepository(StoreSettings).create({
          tenantId: tenant.id,
          description:
            'Herramientas de mano profesionales, maquinaria eléctrica de alto rendimiento y equipamiento de seguridad industrial.',
          phone: '5491155555555',
          whatsapp: '5491155555555',
          address: 'Av. Juan B. Justo 3200, Palermo, CABA',
          primaryColor: '#F97316', // Naranja Industrial
          accentColor: '#1E293B',
          backgroundColor: '#F8FAFC',
          deliveryEnabled: true,
          deliveryCost: 200000,
          deliveryMinOrder: 1500000,
          takeawayEnabled: true,
          cashEnabled: true,
          transferEnabled: true,
          transferAlias: 'picky.ferreteria.mp',
        }),
      );
    }

    // 3. Crear membresía para vincular el ID de usuario provisto
    const membershipRepo = AppDataSource.getRepository(TenantMembership);
    const existingMembership = await membershipRepo.findOne({
      where: { userId: USER_ID, tenantId: tenant.id },
    });

    if (!existingMembership) {
      console.log(
        `🔗 Vinculando membresía ADMIN para el usuario ${USER_ID}...`,
      );
      await membershipRepo.save(
        membershipRepo.create({
          userId: USER_ID,
          tenantId: tenant.id,
          role: UserRole.ADMIN,
          isActive: true,
        }),
      );
    } else {
      console.log('✅ Membresía de administrador ya existe.');
    }

    // 4. CATEGORÍAS (Adición desde cero)
    console.log('\n🛠️ Insertando categorías de Ferretería...');
    const catElectricas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        name: 'Herramientas Eléctricas',
        order: 1,
      }),
    );
    const catMano = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        name: 'Herramientas de Mano',
        order: 2,
      }),
    );
    const catJardin = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        name: 'Maquinaria de Jardín',
        order: 3,
      }),
    );
    const catMedicion = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        name: 'Medición y Precisión',
        order: 4,
      }),
    );
    const catSeguridad = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tenantId: tenant.id,
        name: 'Protección e Industrial',
        order: 5,
      }),
    );

    // 5. PRODUCTOS (Mega catálogo de ferretería)
    console.log('\n🛠️ Insertando catálogo de herramientas...');
    await AppDataSource.getRepository(Product).save(
      [
        // Herramientas Eléctricas
        {
          tenantId: tenant.id,
          categoryId: catElectricas.id,
          order: 1,
          isFeatured: true,
          isActive: true,
          name: 'Rotomartillo Neumático 800W SDS Plus',
          price: 18500000,
          description:
            'Potente motor de 800W con fuerza de impacto de 2.7 Joules. Tres modos de operación: taladro, rotomartillo y cincelador.',
        },
        {
          tenantId: tenant.id,
          categoryId: catElectricas.id,
          order: 2,
          isFeatured: false,
          isActive: true,
          name: 'Amoladora Angular de 4.5" Slim',
          price: 8900000,
          description:
            'Amoladora de 750W con cuerpo delgado y ergonómico. Incluye llave de ajuste y empuñadura auxiliar.',
        },
        {
          tenantId: tenant.id,
          categoryId: catElectricas.id,
          order: 3,
          isFeatured: true,
          isActive: true,
          name: 'Taladro Atornillador Inalámbrico 20V Max',
          price: 23500000,
          description:
            'Taladro con mandril autoajustable de 13mm, 2 velocidades variables, luz LED y set de 2 baterías de litio.',
        },
        // Herramientas de Mano
        {
          tenantId: tenant.id,
          categoryId: catMano.id,
          order: 1,
          isFeatured: true,
          isActive: true,
          name: 'Juego de Tubos y Llaves Cromo Vanadio (x40)',
          price: 34500000,
          description:
            'Set profesional en caja de transporte metálica reforzada. Llave de tubo crique reversible y tubos hexagonales milimétricos.',
        },
        {
          tenantId: tenant.id,
          categoryId: catMano.id,
          order: 2,
          isFeatured: false,
          isActive: true,
          name: 'Pinza Universal Aislada 8" VDE 1000V',
          price: 3900000,
          description:
            'Pinza aislada con mango ergonómico bimaterial. Cumple normas internacionales para trabajos eléctricos seguros hasta 1000V.',
        },
        {
          tenantId: tenant.id,
          categoryId: catMano.id,
          order: 3,
          isFeatured: false,
          isActive: true,
          name: 'Juego de Destornilladores Pro (x8)',
          price: 6800000,
          description:
            'Set de 4 destornilladores planos y 4 destornilladores Phillips con punta imantada.',
        },
        // Jardín
        {
          tenantId: tenant.id,
          categoryId: catJardin.id,
          order: 1,
          isFeatured: true,
          isActive: true,
          name: 'Bordeadora Eléctrica de Césped 600W',
          price: 16900000,
          description:
            'Ancho de corte de 30 cm con doble salida de tanza y mango telescópico ajustable.',
        },
        {
          tenantId: tenant.id,
          categoryId: catJardin.id,
          order: 2,
          isFeatured: false,
          isActive: true,
          name: 'Cortadora de Césped de Empuje 1400W',
          price: 54900000,
          description:
            'Motor de inducción silencioso sin carbones y bolsa recolectora de 40 Litros.',
        },
        // Medición
        {
          tenantId: tenant.id,
          categoryId: catMedicion.id,
          order: 1,
          isFeatured: true,
          isActive: true,
          name: 'Nivel Láser Autonivelante de 3 Planos 360°',
          price: 21900000,
          description:
            'Láser de líneas verdes de gran visibilidad con rango de nivelación de +/- 4 grados.',
        },
        // Seguridad
        {
          tenantId: tenant.id,
          categoryId: catSeguridad.id,
          order: 1,
          isFeatured: false,
          isActive: true,
          name: 'Máscara de Soldar Fotosensible Automática',
          price: 11900000,
          description:
            'Filtro de oscurecimiento automático DIN 9-13 y celda solar de carga rápida.',
        },
      ].map((p) => AppDataSource.getRepository(Product).create(p)),
    );

    console.log(
      '\n✨ ¡Configuración y catálogo de Ferretería inyectados con éxito!',
    );
    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedTenantTools();
