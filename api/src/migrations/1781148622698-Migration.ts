import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781148622698 implements MigrationInterface {
    name = 'Migration1781148622698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN IF EXISTS "description"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "sortOrder"`);
    }

}
