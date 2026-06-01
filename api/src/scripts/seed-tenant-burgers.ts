import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { TenantMembership } from '../modules/auth/entities/tenant-membership.entity.js';
import { UserRole } from '../modules/auth/entities/user.entity.js';
import { Category } from '../modules/catalog/entities/category.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

const TARGET_TENANT_ID = 'b5763874-892d-44d1-8d26-859d0df5d0e1';
const TARGET_USER_ID = '71c45967-4651-4059-b8bd-acc2eca1049b';

async function seedTenantBurgers() {
  console.log('🚀 Iniciando setup del tenant HAMBURGUESERÍA (Existente):', TARGET_TENANT_ID);

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // 1. Obtener o validar el Tenant existente
    let tenant = await AppDataSource.getRepository(Tenant).findOne({ where: { id: TARGET_TENANT_ID } });
    if (!tenant) {
      console.log('⚠️ El tenant no existía. Creándolo con ID provisto...');
      tenant = await AppDataSource.getRepository(Tenant).save(
        AppDataSource.getRepository(Tenant).create({
          id: TARGET_TENANT_ID,
          name: 'Picky Burgers Premium',
          slug: 'picky-burgers-premium',
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
          description: 'Hamburguesas smash de altísima calidad elaboradas con carne premium de pastura y los shakes más cremosos de la ciudad.',
          phone: '5491123456789',
          whatsapp: '5491123456789',
          address: 'Av. Cerviño 3400, Palermo, CABA',
          primaryColor: '#E11D48', // Rojo Premium
          accentColor: '#F59E0B',
          backgroundColor: '#FFFFFF',
          deliveryEnabled: true,
          deliveryCost: 80000,
          deliveryMinOrder: 300000,
          takeawayEnabled: true,
          cashEnabled: true,
          transferEnabled: true,
          transferAlias: 'picky.burgers.mp'
        })
      );
    }

    // 3. Crear membresía para vincular el ID de usuario provisto
    const membershipRepo = AppDataSource.getRepository(TenantMembership);
    const existingMembership = await membershipRepo.findOne({
      where: { userId: TARGET_USER_ID, tenantId: tenant.id }
    });

    if (!existingMembership) {
      console.log(`🔗 Vinculando membresía ADMIN para el usuario ${TARGET_USER_ID}...`);
      await membershipRepo.save(
        membershipRepo.create({
          userId: TARGET_USER_ID,
          tenantId: tenant.id,
          role: UserRole.ADMIN,
          isActive: true
        })
      );
    } else {
      console.log('✅ Membresía de administrador ya existe.');
    }

    // 4. CATEGORÍAS (Adición desde cero)
    console.log('\n🍔 Insertando categorías de Hamburguesas...');
    const catSmashClasicas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Smash Burgers Clásicas', order: 1 })
    );
    const catSmashEspeciales = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Smash Burgers de Autor', order: 2 })
    );
    const catSides = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Acompañamientos Crujientes', order: 3 })
    );
    const catShakes = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Milkshakes & Postres', order: 4 })
    );
    const catBebidas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: tenant.id, name: 'Bebidas Heladas', order: 5 })
    );

    // 5. PRODUCTOS (Adición masiva)
    console.log('\n🍔 Insertando productos...');
    await AppDataSource.getRepository(Product).save([
      {
        tenantId: tenant.id, categoryId: catSmashClasicas.id, order: 1, isFeatured: true, isActive: true,
        name: 'Classic Double Cheeseburger', price: 680000,
        description: 'Dos medallones smash de 90g con costra caramelizada, 4 fetas de cheddar, kétchup, mostaza y cebolla picadita.'
      },
      {
        tenantId: tenant.id, categoryId: catSmashClasicas.id, order: 2, isFeatured: false, isActive: true,
        name: 'Triple Cheeseburger Smash', price: 850000,
        description: 'Tres medallones de carne vacuna premium aplastados finitos, 6 fetas de queso cheddar derretido.'
      },
      {
        tenantId: tenant.id, categoryId: catSmashClasicas.id, order: 3, isFeatured: true, isActive: true,
        name: 'The Oklahoma Onion Single', price: 520000,
        description: 'Medallón smash de 100g con cebolla en juliana cocinada e integrada en la plancha, cheddar y pepinillos.'
      },
      {
        tenantId: tenant.id, categoryId: catSmashEspeciales.id, order: 1, isFeatured: true, isActive: true,
        name: 'Sweet Chili & Crispy Bacon', price: 790000,
        description: 'Doble smash, cheddar, panceta glaseada en sweet chili casero, crocante de cebolla deshidratada y aderezo alioli.'
      },
      {
        tenantId: tenant.id, categoryId: catSmashEspeciales.id, order: 2, isFeatured: false, isActive: true,
        name: 'Smoked Truffle Egg', price: 850000,
        description: 'Doble smash premium, provola ahumada fundida, huevo a la plancha con yema blanda y emulsión de trufa.'
      },
      {
        tenantId: tenant.id, categoryId: catSides.id, order: 1, isFeatured: true, isActive: true,
        name: 'Papas Crinkle con Cheddar y Verdeo', price: 390000,
        description: 'Papas con corte rejilla súper crocantes, crema de queso cheddar templado y cebollita de verdeo.'
      },
      {
        tenantId: tenant.id, categoryId: catSides.id, order: 2, isFeatured: false, isActive: true,
        name: 'Bastones de Mozzarella XXL (x5)', price: 450000,
        description: 'Cuerpo de mozzarella hilada gigante, súper crocantes por fuera y súper elásticos por dentro.'
      },
      {
        tenantId: tenant.id, categoryId: catShakes.id, order: 1, isFeatured: true, isActive: true,
        name: 'Super Oreo & Cream Shake', price: 350000,
        description: 'Licuado súper espeso de helado de crema americana, dulce de leche natural y galletitas Oreo troceadas.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 1, isFeatured: false, isActive: true,
        name: 'Coca Cola Original 500ml', price: 180000,
        description: 'Gaseosa Coca-Cola sabor original bien helada.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 2, isFeatured: false, isActive: true,
        name: 'Coca Cola Sin Azúcar 500ml', price: 180000,
        description: 'Gaseosa Coca-Cola sin azúcares y sin calorías helada.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 3, isFeatured: false, isActive: true,
        name: 'Sprite Sin Azúcar 500ml', price: 180000,
        description: 'Gaseosa lima-limón Sprite sin azúcares helada.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 4, isFeatured: false, isActive: true,
        name: 'Fanta Naranja 500ml', price: 180000,
        description: 'Gaseosa Fanta sabor naranja refrescante.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 5, isFeatured: true, isActive: true,
        name: 'Limonada Casera con Menta y Jengibre', price: 250000,
        description: 'Exprimido natural de limones del día, hojas de menta fresca y un toque de jengibre.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 6, isFeatured: true, isActive: true,
        name: 'Cerveza IPA Artesanal Lata 473ml', price: 320000,
        description: 'Birra artesanal bien fría de lupulado intenso y notas cítricas.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 7, isFeatured: false, isActive: true,
        name: 'Cerveza Golden Artesanal Lata 473ml', price: 300000,
        description: 'Birra artesanal dorada, suave, ligera y sumamente refrescante.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 8, isFeatured: false, isActive: true,
        name: 'Agua Mineral Sin Gas 500ml', price: 150000,
        description: 'Agua mineral de manantial fresca sin gas.'
      },
      {
        tenantId: tenant.id, categoryId: catBebidas.id, order: 9, isFeatured: false, isActive: true,
        name: 'Agua Mineral Con Gas 500ml', price: 150000,
        description: 'Agua mineral gasificada bien helada.'
      }
    ].map(p => AppDataSource.getRepository(Product).create(p)));

    console.log('\n✨ ¡Configuración y catálogo de Hamburguesas inyectados con éxito para el Usuario!');
    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedTenantBurgers();
