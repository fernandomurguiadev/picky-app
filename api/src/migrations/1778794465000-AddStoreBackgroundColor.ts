import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreBackgroundColor1778794465000 implements MigrationInterface {
    name = 'AddStoreBackgroundColor1778794465000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" ADD "backgroundColor" character varying(7) NOT NULL DEFAULT '#ffffff'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "backgroundColor"`);
    }
}
