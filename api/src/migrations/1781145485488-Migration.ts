import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781145485488 implements MigrationInterface {
    name = 'Migration1781145485488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "description"`);
    }

}
