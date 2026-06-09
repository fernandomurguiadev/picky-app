import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780960646099 implements MigrationInterface {
  name = 'Migration1780960646099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD "storeType" character varying(20) NOT NULL DEFAULT 'retail'`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD "customCtaText" character varying(30)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP COLUMN "customCtaText"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP COLUMN "storeType"`,
    );
  }
}
