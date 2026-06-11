import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781191823525 implements MigrationInterface {
    name = 'Migration1781191823525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN IF EXISTS "mapsEmbedUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" ADD "mapsEmbedUrl" character varying(2000)`);
    }

}
