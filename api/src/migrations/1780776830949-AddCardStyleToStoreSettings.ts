import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardStyleToStoreSettings1780776830949 implements MigrationInterface {
  name = 'AddCardStyleToStoreSettings1780776830949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD "cardStyle" character varying(20) NOT NULL DEFAULT 'default'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP COLUMN "cardStyle"`,
    );
  }
}
