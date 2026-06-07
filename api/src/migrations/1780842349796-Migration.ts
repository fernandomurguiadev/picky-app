import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780842349796 implements MigrationInterface {
  name = 'Migration1780842349796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "tableNumber" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "tableNumber"`);
  }
}
