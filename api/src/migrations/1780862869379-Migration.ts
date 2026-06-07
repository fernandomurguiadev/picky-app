import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780862869379 implements MigrationInterface {
    name = 'Migration1780862869379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_tenantId_fkey"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_productId_fkey"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_orderId_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_tenant_product"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_order"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_quantity_check"`);
        await queryRunner.query(`ALTER TYPE "public"."stock_movement_type" RENAME TO "stock_movement_type_old"`);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('purchase_in', 'sale_out', 'adjustment', 'waste', 'cancellation_return')`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "public"."stock_movements_type_enum" USING "type"::"text"::"public"."stock_movements_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movement_type_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_db9fcb4c901068853d81ef374e" ON "stock_movements" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_056f27f5450a7348de3c7797c5" ON "stock_movements" ("tenantId", "productId") `);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_7dde280faf0d06b5b1b067b8ac1" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_a3acb59db67e977be45e382fc56" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_db9fcb4c901068853d81ef374ee" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_db9fcb4c901068853d81ef374ee"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_a3acb59db67e977be45e382fc56"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_7dde280faf0d06b5b1b067b8ac1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_056f27f5450a7348de3c7797c5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db9fcb4c901068853d81ef374e"`);
        await queryRunner.query(`CREATE TYPE "public"."stock_movement_type_old" AS ENUM('purchase_in', 'sale_out', 'adjustment', 'waste', 'cancellation_return')`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "public"."stock_movement_type_old" USING "type"::"text"::"public"."stock_movement_type_old"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."stock_movement_type_old" RENAME TO "stock_movement_type"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_quantity_check" CHECK ((quantity > 0))`);
        await queryRunner.query(`CREATE INDEX "IDX_stock_movements_order" ON "stock_movements" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_stock_movements_tenant_product" ON "stock_movements" ("productId", "tenantId") `);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
