import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781240669608 implements MigrationInterface {
    name = 'Migration1781240669608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenant_order_sequences" ("tenant_id" uuid NOT NULL, "last_order_number" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_207253da9ade694ccce294888f0" PRIMARY KEY ("tenant_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tenant_order_sequences"`);
    }

}
