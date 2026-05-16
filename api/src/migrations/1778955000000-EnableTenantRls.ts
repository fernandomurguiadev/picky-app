import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableTenantRls1778955000000 implements MigrationInterface {
    name = 'EnableTenantRls1778955000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Products
        await queryRunner.query(`ALTER TABLE "products" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "products" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY products_tenant_policy ON "products" FOR ALL USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Categories
        await queryRunner.query(`ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "categories" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY categories_tenant_policy ON "categories" FOR ALL USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Store Settings
        await queryRunner.query(`ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "store_settings" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY store_settings_tenant_policy ON "store_settings" FOR ALL USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Orders
        await queryRunner.query(`ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "orders" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY orders_tenant_policy ON "orders" FOR ALL USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Orders
        await queryRunner.query(`DROP POLICY IF EXISTS orders_tenant_policy ON "orders"`);
        await queryRunner.query(`ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY`);

        // Store Settings
        await queryRunner.query(`DROP POLICY IF EXISTS store_settings_tenant_policy ON "store_settings"`);
        await queryRunner.query(`ALTER TABLE "store_settings" DISABLE ROW LEVEL SECURITY`);

        // Categories
        await queryRunner.query(`DROP POLICY IF EXISTS categories_tenant_policy ON "categories"`);
        await queryRunner.query(`ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY`);

        // Products
        await queryRunner.query(`DROP POLICY IF EXISTS products_tenant_policy ON "products"`);
        await queryRunner.query(`ALTER TABLE "products" DISABLE ROW LEVEL SECURITY`);
    }
}
