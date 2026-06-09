import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1780970441902 implements MigrationInterface {
    name = 'Migration1780970441902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "isOnboardingCompleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "isOnboardingCompleted"`);
    }

}
