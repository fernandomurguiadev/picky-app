import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { TenantMembership } from '../modules/auth/entities/tenant-membership.entity.js';
import { UserRole } from '../modules/auth/entities/user.entity.js';
import { Category } from '../modules/catalog/entities/category.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

const TENANT_ID = '43640248-2321-4d32-aa7a-241517441cb1'; // Fijo para evitar duplicar
const USER_ID = '71c45967-4651-4059-b8bd-acc2eca1049b';

async function seedTenantClothing() {
  console.log('🚀 Iniciando setup del nuevo tenant de MODA/ESTILO...');

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // 1. Obtener o crear el Tenant
    let tenant = await AppDataSource.getRepository(Tenant).findOne({ where: { id: TENANT_ID } });
    if (!tenant) {
      console.log('👗 Creando nuevo Tenant "Picky Style"...');
      tenant = await AppDataSource.getRepository(Tenant).save(
        AppDataSource.getRepository(Tenant).create({
          id: TENANT_ID,
          name: 'Picky Style & Co',
          slug: 'picky-style',
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
          description: 'Las últimas tendencias en indumentaria urbana y de diseño. Calidad premium y envíos a todo el país.',
          phone: '5491133333333',
          whatsapp: '5491133333333',
          address: 'Honduras 4800, Palermo, CABA',
          primaryColor: '#EC4899', // Rosa vibrante / magenta pastel
          accentColor: '#10B981',
          backgroundColor: '#FFFFFF',
          deliveryEnabled: true,
          deliveryCost: 120000,
          deliveryMinOrder: 500000,
          takeawayEnabled: true,
          cashEnabled: true,
          transferEnabled: true,
          transferAlias: 'picky.style.mp'
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
    console.log('\n👗 Insertando categorías de Ropa...');
    const catRemeras = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Remeras y Tops', order: 1 })
    );
    const catPantalones = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Pantalones y Joggers', order: 2 })
    );
    const catCamperas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Camperas y Abrigos', order: 3 })
    );
    const catCalzado = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Calzado Premium', order: 4 })
    );

    // 5. PRODUCTOS
    console.log('\n🛍️ Insertando prendas del catálogo...');
    await AppDataSource.getRepository(Product).save([
      {
        tenantId: tenant.id, categoryId: catRemeras.id, order: 1, isFeatured: true, isActive: true,
        name: 'Remera Oversize Básica', price: 189900,
        description: 'Remera oversize 100% algodón pesado 220g. Talle único XS al XL. En blanco, negro y arena.'
      },
      {
        tenantId: tenant.id, categoryId: catPantalones.id, order: 1, isFeatured: true, isActive: true,
        name: 'Jogger Cargo Técnico', price: 499900,
        description: 'Pantalón cargo scuba técnico con cierres termosellados y bolsillos laterales amplios.'
      },
      {
        tenantId: tenant.id, categoryId: catCamperas.id, order: 1, isFeatured: true, isActive: true,
        name: 'Campera Puffer Ultraliviana', price: 1199000,
        description: 'Relleno de pluma sintética ecológica, repele el agua ligera y corta el viento.'
      },
      {
        tenantId: tenant.id, categoryId: catCalzado.id, order: 1, isFeatured: true, isActive: true,
        name: 'Zapatilla Chunky Retro', price: 1399000,
        description: 'Diseño retro deportivo con suela de goma expandida y plantilla viscoelástica.'
      }
    ].map(p => AppDataSource.getRepository(Product).create(p)));

    console.log('\n✨ ¡Configuración y catálogo de Moda inyectados con éxito!');
    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}
seedTenantClothing();
