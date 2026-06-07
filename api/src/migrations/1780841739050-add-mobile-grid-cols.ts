import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobileGridCols1780841739050 implements MigrationInterface {
  name = 'AddMobileGridCols1780841739050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" ADD "mobileGridCols" integer NOT NULL DEFAULT '2'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "store_settings" DROP COLUMN "mobileGridCols"`,
    );
  }
}
