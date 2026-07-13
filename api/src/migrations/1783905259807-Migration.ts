import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1783905259807 implements MigrationInterface {
    name = 'Migration1783905259807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ADD "unitCost" integer`);
        await queryRunner.query(`ALTER TABLE "products" ADD "costPrice" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "costPrice"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "unitCost"`);
    }

}
