import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableTenantRls1778955000000 implements MigrationInterface {
    name = 'EnableTenantRls1778955000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Products
        await queryRunner.query(`ALTER TABLE "products" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "products" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY products_select_policy ON "products" FOR SELECT USING (true)`);
        await queryRunner.query(`CREATE POLICY products_insert_policy ON "products" FOR INSERT WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY products_update_policy ON "products" FOR UPDATE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY products_delete_policy ON "products" FOR DELETE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Categories
        await queryRunner.query(`ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "categories" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY categories_select_policy ON "categories" FOR SELECT USING (true)`);
        await queryRunner.query(`CREATE POLICY categories_insert_policy ON "categories" FOR INSERT WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY categories_update_policy ON "categories" FOR UPDATE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY categories_delete_policy ON "categories" FOR DELETE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Store Settings
        await queryRunner.query(`ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "store_settings" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY store_settings_insert_policy ON "store_settings" FOR INSERT WITH CHECK (true)`);
        await queryRunner.query(`CREATE POLICY store_settings_select_policy ON "store_settings" FOR SELECT USING (true)`); // También hacemos público el select de settings
        await queryRunner.query(`CREATE POLICY store_settings_update_policy ON "store_settings" FOR UPDATE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY store_settings_delete_policy ON "store_settings" FOR DELETE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);

        // Orders — split policies like store_settings to allow public INSERT
        // once app.current_tenant_id is set inside the transaction.
        await queryRunner.query(`ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE "orders" FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY orders_insert_policy ON "orders" FOR INSERT WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY orders_select_policy ON "orders" FOR SELECT USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY orders_update_policy ON "orders" FOR UPDATE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
        await queryRunner.query(`CREATE POLICY orders_delete_policy ON "orders" FOR DELETE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Orders
        await queryRunner.query(`DROP POLICY IF EXISTS orders_tenant_policy ON "orders"`);
        await queryRunner.query(`DROP POLICY IF EXISTS orders_insert_policy ON "orders"`);
        await queryRunner.query(`DROP POLICY IF EXISTS orders_select_policy ON "orders"`);
        await queryRunner.query(`DROP POLICY IF EXISTS orders_update_policy ON "orders"`);
        await queryRunner.query(`DROP POLICY IF EXISTS orders_delete_policy ON "orders"`);
        await queryRunner.query(`ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY`);

        // Store Settings
        await queryRunner.query(`DROP POLICY IF EXISTS store_settings_select_policy ON "store_settings"`);
        await queryRunner.query(`DROP POLICY IF EXISTS store_settings_update_policy ON "store_settings"`);
        await queryRunner.query(`DROP POLICY IF EXISTS store_settings_delete_policy ON "store_settings"`);
        await queryRunner.query(`DROP POLICY IF EXISTS store_settings_insert_policy ON "store_settings"`);
        await queryRunner.query(`ALTER TABLE "store_settings" DISABLE ROW LEVEL SECURITY`);

        // Categories
        await queryRunner.query(`DROP POLICY IF EXISTS categories_select_policy ON "categories"`);
        await queryRunner.query(`DROP POLICY IF EXISTS categories_insert_policy ON "categories"`);
        await queryRunner.query(`DROP POLICY IF EXISTS categories_update_policy ON "categories"`);
        await queryRunner.query(`DROP POLICY IF EXISTS categories_delete_policy ON "categories"`);
        await queryRunner.query(`ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY`);

        // Products
        await queryRunner.query(`DROP POLICY IF EXISTS products_select_policy ON "products"`);
        await queryRunner.query(`DROP POLICY IF EXISTS products_insert_policy ON "products"`);
        await queryRunner.query(`DROP POLICY IF EXISTS products_update_policy ON "products"`);
        await queryRunner.query(`DROP POLICY IF EXISTS products_delete_policy ON "products"`);
        await queryRunner.query(`ALTER TABLE "products" DISABLE ROW LEVEL SECURITY`);
    }
}
