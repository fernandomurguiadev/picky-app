import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';
import { Tenant } from '../modules/tenants/entities/tenant.entity.js';
import { Product } from '../modules/catalog/entities/product.entity.js';

async function testRls() {
  console.log(
    '🧪 Iniciando verificación avanzada de Row-Level Security (RLS)...',
  );
  await AppDataSource.initialize();

  try {
    // 1. Crear rol de no-superuser para validar RLS
    console.log('🔑 Creando/Actualizando rol no-superuser picky_rls_user...');
    await AppDataSource.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'picky_rls_user') THEN
          CREATE ROLE picky_rls_user WITH LOGIN PASSWORD 'picky_rls_password';
        END IF;
      END
      $$;
    `);

    // Otorgamos privilegios a picky_rls_user para leer las tablas
    await AppDataSource.query(
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO picky_rls_user;`,
    );
    await AppDataSource.query(
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO picky_rls_user;`,
    );

    const tenants = await AppDataSource.getRepository(Tenant).find({
      where: [{ slug: 'picky-burgers' }, { slug: 'picky-cerrajeria' }],
    });

    if (tenants.length < 2) {
      console.log(
        '❌ Se necesitan al menos 2 tenants en la base de datos. Ejecutá primero: npm run db:seed --prefix api',
      );
      return;
    }

    const [burgerTenant, lockTenant] = tenants;
    console.log(`🍔 Tenant 1: ${burgerTenant.name} (${burgerTenant.id})`);
    console.log(`🔑 Tenant 2: ${lockTenant.name} (${lockTenant.id})\n`);

    // =========================================================================
    // CASO 1: Contexto Picky Burgers (🍔) con rol no-superuser
    // =========================================================================
    console.log(
      '--- CASO 1: Ejecutando consulta bajo el contexto de Picky Burgers (Rol picky_rls_user) ---',
    );
    const runner1 = AppDataSource.createQueryRunner();
    await runner1.connect();
    await runner1.startTransaction();

    // Cambiamos al rol no-superuser para que Postgres aplique RLS
    await runner1.query('SET ROLE picky_rls_user;');
    await runner1.query(
      "SELECT set_config('app.current_tenant_id', $1, true);",
      [burgerTenant.id],
    );

    const products1 = await runner1.manager.getRepository(Product).find();
    console.log(`📊 Productos devueltos: ${products1.length}`);
    let leaks1 = 0;
    products1.forEach((p) => {
      const isCorrect = p.tenantId === burgerTenant.id;
      if (!isCorrect) leaks1++;
      console.log(
        `   - [${isCorrect ? 'CORRECTO' : 'LEAK'}] ${p.name} (Tenant: ${p.tenantId})`,
      );
    });

    await runner1.rollbackTransaction();
    await runner1.release();

    // =========================================================================
    // CASO 2: Contexto Picky Cerrajería (🔑) con rol no-superuser
    // =========================================================================
    console.log(
      '\n--- CASO 2: Ejecutando consulta bajo el contexto de Picky Cerrajería (Rol picky_rls_user) ---',
    );
    const runner2 = AppDataSource.createQueryRunner();
    await runner2.connect();
    await runner2.startTransaction();

    await runner2.query('SET ROLE picky_rls_user;');
    await runner2.query(
      "SELECT set_config('app.current_tenant_id', $1, true);",
      [lockTenant.id],
    );

    const products2 = await runner2.manager.getRepository(Product).find();
    console.log(`📊 Productos devueltos: ${products2.length}`);
    let leaks2 = 0;
    products2.forEach((p) => {
      const isCorrect = p.tenantId === lockTenant.id;
      if (!isCorrect) leaks2++;
      console.log(
        `   - [${isCorrect ? 'CORRECTO' : 'LEAK'}] ${p.name} (Tenant: ${p.tenantId})`,
      );
    });

    await runner2.rollbackTransaction();
    await runner2.release();

    // =========================================================================
    // CASO 3: Sin Contexto con rol no-superuser (🔒 SEGURO POR DEFECTO)
    // =========================================================================
    console.log(
      '\n--- CASO 3: Ejecutando consulta SIN definir contexto (Rol picky_rls_user - Debería retornar 0 productos) ---',
    );
    const runner3 = AppDataSource.createQueryRunner();
    await runner3.connect();
    await runner3.startTransaction();

    await runner3.query('SET ROLE picky_rls_user;');
    const products3 = await runner3.manager.getRepository(Product).find();
    console.log(`📊 Productos devueltos: ${products3.length}`);
    if (products3.length === 0) {
      console.log(
        '✅ EXCELENTE: RLS previno la consulta de forma predeterminada al no proveer tenant context.',
      );
    } else {
      console.log('❌ ERROR: RLS no está bloqueando consultas sin contexto.');
    }

    await runner3.rollbackTransaction();
    await runner3.release();

    // =========================================================================
    // CONCLUSIÓN GENERAL
    // =========================================================================
    console.log('\n=====================================================');
    if (leaks1 === 0 && leaks2 === 0 && products3.length === 0) {
      console.log(
        '🎉 VERIFICACIÓN COMPLETA: ROW-LEVEL SECURITY EN BASE DE DATOS ES 100% OPERATIVA Y SEGURA!',
      );
      console.log('   - Aislamiento impecable entre tenants.');
      console.log(
        '   - Prevención activa de fugas accidentales sin tenant context.',
      );
    } else {
      console.log(
        '⚠️ VERIFICACIÓN CON OBSERVACIONES: Se detectaron leaks en el aislamiento lógico.',
      );
    }
    console.log('=====================================================');
  } catch (error) {
    console.error('❌ Error durante la verificación RLS:', error);
  } finally {
    // Restauramos el rol y destruimos conexión
    await AppDataSource.query('RESET ROLE;');
    await AppDataSource.destroy();
  }
}

testRls();
