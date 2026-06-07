import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockQuantityAndMovementsTable1780845183168 implements MigrationInterface {
  name = 'AddStockQuantityAndMovementsTable1780845183168';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add stockQuantity to products
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "stockQuantity" integer NULL DEFAULT NULL`
    );

    // 2. Create stock_movement_type type (or use varchar/text to avoid enum migration complexities, but database design specifies postgres type)
    await queryRunner.query(
      `CREATE TYPE "stock_movement_type" AS ENUM ('purchase_in', 'sale_out', 'adjustment', 'waste', 'cancellation_return')`
    );

    // 3. Create stock_movements table
    await queryRunner.query(
      `CREATE TABLE "stock_movements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
        "type" "stock_movement_type" NOT NULL,
        "quantity" integer NOT NULL CHECK ("quantity" > 0),
        "notes" text NULL,
        "orderId" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
        "createdBy" uuid NULL,
        "createdAt" timestamp NOT NULL DEFAULT now()
      )`
    );

    // 4. Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_tenant_product" ON "stock_movements" ("tenantId", "productId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_order" ON "stock_movements" ("orderId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_stock_movements_order"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_movements_tenant_product"`);

    // 2. Drop table
    await queryRunner.query(`DROP TABLE "stock_movements"`);

    // 3. Drop type
    await queryRunner.query(`DROP TYPE "stock_movement_type"`);

    // 4. Drop stockQuantity column
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stockQuantity"`);
  }
}
