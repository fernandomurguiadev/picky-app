import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780845183167 implements MigrationInterface {
  name = 'Migration1780845183167';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "inStock" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9938bff0f1d7e3c686a456ad11" ON "products" ("tenantId", "inStock") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9938bff0f1d7e3c686a456ad11"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "inStock"`);
  }
}
