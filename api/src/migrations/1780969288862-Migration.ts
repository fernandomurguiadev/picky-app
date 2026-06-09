import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780969288862 implements MigrationInterface {
  name = 'Migration1780969288862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "isGroupPricingEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "groupPrice" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "groupPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "isGroupPricingEnabled"`,
    );
  }
}
