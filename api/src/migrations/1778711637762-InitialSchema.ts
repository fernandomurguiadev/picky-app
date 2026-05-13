import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778711637762 implements MigrationInterface {
    name = 'InitialSchema1778711637762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" ADD "isManualOpen" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "isManualOpen"`);
    }

}
