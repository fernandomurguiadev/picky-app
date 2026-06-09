import { MigrationInterface, QueryRunner } from 'typeorm';

export class StockMovementsRls1780845183169 implements MigrationInterface {
  name = 'StockMovementsRls1780845183169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" FORCE ROW LEVEL SECURITY`,
    );

    // SELECT policy is public/free because storefront or orders might read or select_policy can check tenantId just like orders does.
    // Wait, the proposal says:
    // CREATE POLICY sm_select ON stock_movements FOR SELECT USING (true);
    // Let's stick to proposal but we can also restrict select to current tenant just like categories and products do.
    // Wait, categories and products select policy is: USING (true).
    // Let's use standard tenant check or USING (true) as described in the proposal:
    await queryRunner.query(
      `CREATE POLICY sm_select_policy ON "stock_movements" FOR SELECT USING (true)`,
    );
    await queryRunner.query(
      `CREATE POLICY sm_insert_policy ON "stock_movements" FOR INSERT WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`,
    );
    await queryRunner.query(
      `CREATE POLICY sm_update_policy ON "stock_movements" FOR UPDATE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`,
    );
    await queryRunner.query(
      `CREATE POLICY sm_delete_policy ON "stock_movements" FOR DELETE USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS sm_delete_policy ON "stock_movements"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS sm_update_policy ON "stock_movements"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS sm_insert_policy ON "stock_movements"`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS sm_select_policy ON "stock_movements"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DISABLE ROW LEVEL SECURITY`,
    );
  }
}
