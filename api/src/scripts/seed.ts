import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { StoreSettings } from '../modules/tenants/entities/store-settings.entity.js';
import { User, UserRole } from '../modules/auth/entities/user.entity.js';
import { TenantMembership } from '../modules/auth/entities/tenant-membership.entity.js';
import { Category } from '../modules/catalog/entities/category.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

async function seed() {
  console.log('🚀 Iniciando inicialización EXPANDIDA de base de datos...');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida.');

    const email = 'fernandoemanuelmp@gmail.com';
    const rawPassword = '@Fer123456';
    const bcryptRounds = 12;
    const passwordHash = await bcrypt.hash(rawPassword, bcryptRounds);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // =========================================================================
    // LIMPIEZA PREVIA (IDEMPOTENCIA)
    // =========================================================================
    console.log('🧹 Limpiando registros previos de Picky Burgers y Picky Cerrajería...');
    const existingTenants = await AppDataSource.getRepository(Tenant).find({
      where: [
        { slug: 'picky-burgers' },
        { slug: 'picky-cerrajeria' }
      ]
    });

    if (existingTenants.length > 0) {
      const tenantIds = existingTenants.map(t => `'${t.id}'`).join(',');
      console.log(`🗑️ Eliminando registros antiguos para ${existingTenants.length} tenants...`);
      
      // Borrado secuencial para respetar claves foráneas
      await queryRunner.query(`DELETE FROM products WHERE "tenantId" IN (${tenantIds})`);
      await queryRunner.query(`DELETE FROM categories WHERE "tenantId" IN (${tenantIds})`);
      await queryRunner.query(`DELETE FROM store_settings WHERE "tenantId" IN (${tenantIds})`);
      await queryRunner.query(`DELETE FROM tenant_memberships WHERE "tenantId" IN (${tenantIds})`);
      await queryRunner.query(`DELETE FROM users WHERE email = '${email}'`);
      await queryRunner.query(`DELETE FROM tenants WHERE id IN (${tenantIds})`);
    }

    // =========================================================================
    // SEED TENANT 1: PICKY BURGERS (🍔 GASTRONOMÍA COMPLETA)
    // =========================================================================
    console.log('\n🍔 Generando catálogo premium para "Picky Burgers"...');
    
    const burgerTenant = await AppDataSource.getRepository(Tenant).save(
      AppDataSource.getRepository(Tenant).create({
        name: 'Picky Burgers',
        slug: 'picky-burgers',
        isActive: true
      })
    );

    await AppDataSource.getRepository(StoreSettings).save(
      AppDataSource.getRepository(StoreSettings).create({
        tenantId: burgerTenant.id,
        description: 'Hamburguesas artesanales con carne de pastura, pan de papa casero y salsas secretas. Un viaje de ida.',
        phone: '5491123456789',
        whatsapp: '5491123456789',
        address: 'Av. Cerviño 3400, Palermo, CABA',
        primaryColor: '#E11D48', // Rojo Rose
        deliveryEnabled: true,
        deliveryCost: 80000, // $800.00
        deliveryMinOrder: 300000, // $3000.00
        takeawayEnabled: true,
        cashEnabled: true,
        transferEnabled: true,
        transferAlias: 'picky.burgers.mp'
      })
    );

    const adminUser = await AppDataSource.getRepository(User).save(
      AppDataSource.getRepository(User).create({
        email: email,
        passwordHash: passwordHash,
        role: UserRole.ADMIN,
        isActive: true
      })
    );

    await AppDataSource.getRepository(TenantMembership).save(
      AppDataSource.getRepository(TenantMembership).create({
        userId: adminUser.id,
        tenantId: burgerTenant.id,
        role: UserRole.ADMIN,
        isActive: true
      })
    );

    // CATEGORÍAS - BURGERS
    const catVacunas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Hamburguesas Vacunas', order: 1 })
    );
    const catPollo = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Pollo y Crispy', order: 2 })
    );
    const catVeggies = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Opciones Veggie', order: 3 })
    );
    const catEntradas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Papas y Entradas', order: 4 })
    );
    const catBebidas = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Bebidas Heladas', order: 5 })
    );
    const catPostres = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: burgerTenant.id, name: 'Postres tentación', order: 6 })
    );

    // PRODUCTOS - BURGERS
    console.log('  🍔 Insertando grilla de comida gourmet...');
    await AppDataSource.getRepository(Product).save([
      // Vacunas
      {
        tenantId: burgerTenant.id, categoryId: catVacunas.id, order: 1, isFeatured: true, isActive: true,
        name: 'Picky Bacon Double', price: 780000,
        description: 'Dos medallones de carne smash de 100g, cuádruple cheddar, abundante panceta ahumada súper crocante y ketchup Picky.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catVacunas.id, order: 2, isFeatured: false, isActive: true,
        name: 'La Criolla', price: 850000,
        description: 'Medallón de carne de 180g, provoleta a la plancha, morrones asados, rúcula selvática y chimichurri de la casa.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catVacunas.id, order: 3, isFeatured: true, isActive: true,
        name: 'Oklahoma Onion Burger', price: 720000,
        description: 'Doble smash integrado con cebolla cortada bien finita sobre la plancha, cheddar derretido y pepinillos agridulces.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catVacunas.id, order: 4, isFeatured: false, isActive: true,
        name: 'Triple Cheddar Extrema', price: 990000,
        description: 'Tres medallones de carne de 100g intercalados con 6 fetas de cheddar premium. Solo para valientes.'
      },
      // Pollo
      {
        tenantId: burgerTenant.id, categoryId: catPollo.id, order: 1, isFeatured: false, isActive: true,
        name: 'Crispy Chicken Sándwich', price: 690000,
        description: 'Pechuga de pollo marinada y rebozada en panko extra crocante, lechuga capuchina fresca, mayonesa de ajo y pepinillos.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catPollo.id, order: 2, isFeatured: false, isActive: true,
        name: 'Honey & Mustard Chicken', price: 740000,
        description: 'Pollo frito crujiente, bañado en nuestra salsa casera de mostaza y miel orgánica, queso emmental y panceta.'
      },
      // Veggie
      {
        tenantId: burgerTenant.id, categoryId: catVeggies.id, order: 1, isFeatured: false, isActive: true,
        name: 'Not Picky Cheeseburger', price: 810000,
        description: 'Medallón 100% vegetal de la marca NotCo, queso vegano derretido, tomate, lechuga y aderezo vegano.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catVeggies.id, order: 2, isFeatured: false, isActive: true,
        name: 'Veggie Boom (Gírgolas)', price: 890000,
        description: 'Hongo gírgola empanado en panko, provoleta vegana, cebolla caramelizada y rúcula fresca en pan de remolacha.'
      },
      // Entradas
      {
        tenantId: burgerTenant.id, categoryId: catEntradas.id, order: 1, isFeatured: true, isActive: true,
        name: 'Papas Picky Especiales', price: 420000,
        description: 'Papas rústicas triples cocción con salsa cheddar, cebollita de verdeo picada y trocitos de panceta crocante.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catEntradas.id, order: 2, isFeatured: false, isActive: true,
        name: 'Aros de Cebolla Crujientes', price: 350000,
        description: 'Diez unidades de aros de cebolla gigantes rebozados en cerveza negra. Acompañados de salsa barbacoa.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catEntradas.id, order: 3, isFeatured: false, isActive: true,
        name: 'Bastones de Mozzarella (x6)', price: 480000,
        description: 'Rellenos de mozzarella pura hilada, súper elásticos por dentro y crujientes por fuera. Con salsa pomodoro.'
      },
      // Bebidas
      {
        tenantId: burgerTenant.id, categoryId: catBebidas.id, order: 1, isFeatured: false, isActive: true,
        name: 'Cerveza IPA Artesanal 473ml', price: 300000,
        description: 'Lata bien fría de nuestra IPA de la casa. Amargor medio, notas frutales e intensas.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catBebidas.id, order: 2, isFeatured: false, isActive: true,
        name: 'Gaseosa Línea Coca-Cola 500ml', price: 180000,
        description: 'Elegí sabor en las notas del pedido (Original, Sin Azúcar, Sprite o Fanta).'
      },
      {
        tenantId: burgerTenant.id, categoryId: catBebidas.id, order: 3, isFeatured: false, isActive: true,
        name: 'Limonada Casera con Menta', price: 250000,
        description: 'Limonada fresca exprimida en el día con hojas de menta orgánica y un toque de jengibre.'
      },
      // Postres
      {
        tenantId: burgerTenant.id, categoryId: catPostres.id, order: 1, isFeatured: false, isActive: true,
        name: 'Chocotorta Clásica en Vaso', price: 390000,
        description: 'El clásico argentino reversionado. Capas de galletitas de chocolate remojadas y crema de dulce de leche.'
      },
      {
        tenantId: burgerTenant.id, categoryId: catPostres.id, order: 2, isFeatured: false, isActive: true,
        name: 'Volcán de Chocolate Belga', price: 550000,
        description: 'Tarta caliente de bizcocho de chocolate con centro líquido fundido. Ideal para calentar 20 seg en microondas.'
      }
    ].map(p => AppDataSource.getRepository(Product).create(p)));


    // =========================================================================
    // SEED TENANT 2: PICKY CERRAJERIA (🔑 FERRETERÍA + SERVICIOS)
    // =========================================================================
    console.log('\n🔑 Generando catálogo de cerrajería e inyectando SERVICIOS...');
    
    const lockTenant = await AppDataSource.getRepository(Tenant).save(
      AppDataSource.getRepository(Tenant).create({
        name: 'Picky Cerrajería',
        slug: 'picky-cerrajeria',
        isActive: true
      })
    );

    await AppDataSource.getRepository(StoreSettings).save(
      AppDataSource.getRepository(StoreSettings).create({
        tenantId: lockTenant.id,
        description: 'Cerrajería integral del hogar y automotor. Especialistas en copias de llaves computadas, venta de herrajes y servicios de cerrajería de emergencia 24 horas.',
        phone: '5491198765432',
        whatsapp: '5491198765432',
        address: 'Av. Cabildo 2200, Belgrano, CABA',
        primaryColor: '#2563EB', // Azul Business
        deliveryEnabled: true,
        deliveryCost: 100000, // $1000.00
        deliveryMinOrder: 400000, // $4000.00
        takeawayEnabled: true,
        cashEnabled: true,
        transferEnabled: true,
        transferAlias: 'cerrajeria.picky.mp'
      })
    );

    // Vincular el MISMO Usuario Admin a la segunda tienda (Cerrajería)
    await AppDataSource.getRepository(TenantMembership).save(
      AppDataSource.getRepository(TenantMembership).create({
        userId: adminUser.id,
        tenantId: lockTenant.id,
        role: UserRole.ADMIN,
        isActive: true
      })
    );

    // CATEGORÍAS - CERRAJERÍA
    const catResidencial = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: lockTenant.id, name: 'Cerraduras Residenciales', order: 1 })
    );
    const catSeguridad = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: lockTenant.id, name: 'Candados de Alta Seguridad', order: 2 })
    );
    const catHerrajes = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: lockTenant.id, name: 'Picaportes y Herrajes', order: 3 })
    );
    const catAutomotor = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: lockTenant.id, name: 'Mandos y Cerrajería Automotor', order: 4 })
    );
    const catServicios = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({ tenantId: lockTenant.id, name: 'Servicios Técnicos y Urgencias', order: 5 })
    );

    // PRODUCTOS Y SERVICIOS - CERRAJERÍA
    console.log('  🔑 Insertando productos tangibles y SERVICIOS PROFESIONALES...');
    await AppDataSource.getRepository(Product).save([
      // Cerraduras
      {
        tenantId: lockTenant.id, categoryId: catResidencial.id, order: 1, isFeatured: true, isActive: true,
        name: 'Cerradura Kallay 501 Doble Paleta', price: 1450000,
        description: 'Cerradura clásica reforzada de seguridad para puertas exteriores de madera o chapa. Incluye bocallave y dos llaves de bronce.'
      },
      {
        tenantId: lockTenant.id, categoryId: catResidencial.id, order: 2, isFeatured: false, isActive: true,
        name: 'Cerrojo Trabex 1025 de Seguridad', price: 980000,
        description: 'Cerrojo auxiliar con sistema de 6 combinaciones. Terminación cromada de alta durabilidad. Ideal como refuerzo superior.'
      },
      {
        tenantId: lockTenant.id, categoryId: catResidencial.id, order: 3, isFeatured: true, isActive: true,
        name: 'Cerradura Electromagnética 280kg Fuerza', price: 3800000,
        description: 'Cerradura magnética ideal para control de acceso en edificios y oficinas. No tiene piezas móviles, libre de desgaste.'
      },
      // Candados
      {
        tenantId: lockTenant.id, categoryId: catSeguridad.id, order: 1, isFeatured: false, isActive: true,
        name: 'Candado Sekur de Bronce Macizo 50mm', price: 560000,
        description: 'Cuerpo de latón forjado pulido, gancho de acero carbonitrurado templado y cromado. Resistente al corte con sierra.'
      },
      {
        tenantId: lockTenant.id, categoryId: catSeguridad.id, order: 2, isFeatured: true, isActive: true,
        name: 'Cadena Cementada para Moto + Candado Blindado', price: 2450000,
        description: 'Kit de seguridad extrema. Cadena de 1.20 metros con eslabones de 12mm de acero cementado y funda de nailon protectora.'
      },
      {
        tenantId: lockTenant.id, categoryId: catSeguridad.id, order: 3, isFeatured: false, isActive: true,
        name: 'Candado TSA 3 Dígitos para Valija', price: 180000,
        description: 'Candado de combinación homologado por normas de aeropuertos internacionales para equipaje de viaje.'
      },
      // Herrajes
      {
        tenantId: lockTenant.id, categoryId: catHerrajes.id, order: 1, isFeatured: false, isActive: true,
        name: 'Manija Doble Balancín Currao Sanatorio', price: 3200000,
        description: 'Par de manijas de acero inoxidable esmerilado premium con rosetas y bocallaves. Diseño minimalista atemporal.'
      },
      {
        tenantId: lockTenant.id, categoryId: catHerrajes.id, order: 2, isFeatured: false, isActive: true,
        name: 'Mirilla Telescópica Gran Angular Bronce', price: 85000,
        description: 'Ojo de buey óptico con ángulo de visión de 180 grados ajustable para distintos grosores de puerta.'
      },
      // Automotor
      {
        tenantId: lockTenant.id, categoryId: catAutomotor.id, order: 1, isFeatured: false, isActive: true,
        name: 'Carcasa de Llave Navaja Peugeot/Citroen', price: 420000,
        description: 'Reemplazo de carcasa plástica gastada o dañada de 2 o 3 botones. No incluye circuito electrónico interno.'
      },
      {
        tenantId: lockTenant.id, categoryId: catAutomotor.id, order: 2, isFeatured: false, isActive: true,
        name: 'Control Remoto Portón Clonador Multifrecuencia', price: 165000,
        description: 'Mando a distancia clonador universal para portones eléctricos automáticos de garaje.'
      },
      
      // =======================================================================
      // SERVICIOS TÉCNICOS (💡 DEMOSTRACIÓN DE MANO DE OBRA/SERVICIOS)
      // =======================================================================
      {
        tenantId: lockTenant.id, categoryId: catServicios.id, order: 1, isFeatured: true, isActive: true,
        name: 'Servicio de Apertura de Puerta (Urgencia 24h)', price: 1800000,
        description: 'ASISTENCIA EN EL ACTO. Mano de obra base para la apertura a domicilio de puertas trabadas o con llaves perdidas/adentro. La tarifa cubre el traslado en CABA.'
      },
      {
        tenantId: lockTenant.id, categoryId: catServicios.id, order: 2, isFeatured: true, isActive: true,
        name: 'Instalación Profesional de Cerradura', price: 2500000,
        description: 'MANO DE OBRA. Instalación en el día de cerraduras de seguridad en puertas de madera o metal por cerrajero matriculado. Incluye garantía de colocación.'
      },
      {
        tenantId: lockTenant.id, categoryId: catServicios.id, order: 3, isFeatured: false, isActive: true,
        name: 'Cambio de Combinación de Cerradura Doble Paleta', price: 1200000,
        description: 'SERVICIO TÉCNICO. Modificación interna del secreto de tu cerradura actual para inhabilitar llaves viejas. Incluye 2 llaves nuevas.'
      },
      {
        tenantId: lockTenant.id, categoryId: catServicios.id, order: 4, isFeatured: false, isActive: true,
        name: 'Duplicado de Llave Computada / Multipunto', price: 350000,
        description: 'SERVICIO EN LOCAL. Copia exacta de llaves computadas tipo multipunto de alta seguridad en maquinado electrónico CNC de última generación.'
      }
    ].map(p => AppDataSource.getRepository(Product).create(p)));


    console.log('\n✨ ¡BASE DE DATOS POBLADA CON ÉXITO Y TONELADAS DE EJEMPLOS!');
    console.log('-----------------------------------------------------');
    console.log('🔑 CREDENCIALES UNIFICADAS MULTI-TIENDA:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Contraseña: ${rawPassword}`);
    console.log('-----------------------------------------------------');
    console.log('👉 Con esta cuenta ahora tenés acceso a AMBOS comercios:');
    console.log('   🍔 Picky Burgers: http://localhost:2000/picky-burgers');
    console.log('   🔑 Picky Cerrajería: http://localhost:2000/picky-cerrajeria');
    console.log('👉 Admin Dashboard: http://localhost:2000/auth/login');
    console.log('-----------------------------------------------------');

    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error fatídico durante el seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
