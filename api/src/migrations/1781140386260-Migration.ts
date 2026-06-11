import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781140386260 implements MigrationInterface {
    name = 'Migration1781140386260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ADD "priceMonthly" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "priceMonthly"`);
    }

}
