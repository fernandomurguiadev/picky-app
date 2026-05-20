import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCircularSettings1778954005657 implements MigrationInterface {
    name = 'FixCircularSettings1778954005657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" ADD "backgroundColor" character varying(7) NOT NULL DEFAULT '#ffffff'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "backgroundColor"`);
    }

}
