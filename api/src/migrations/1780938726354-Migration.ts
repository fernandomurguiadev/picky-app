import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780938726354 implements MigrationInterface {
    name = 'Migration1780938726354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "imagePublicId" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "imagePublicId"`);
    }

}
