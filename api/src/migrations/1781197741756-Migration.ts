import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781197741756 implements MigrationInterface {
    name = 'Migration1781197741756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(100) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c0e1f5d0ba8027c186705d752b8" UNIQUE ("code"), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plan_features" ("planId" uuid NOT NULL, "featureId" uuid NOT NULL, CONSTRAINT "PK_2e0ecae2b4143789a6802b4d047" PRIMARY KEY ("planId", "featureId"))`);
        await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "mapsEmbedUrl"`);
        await queryRunner.query(`ALTER TABLE "plan_features" ADD CONSTRAINT "FK_33f1dcdcdf132c3a113e8c4505d" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_features" ADD CONSTRAINT "FK_58f238ad09370f078bbae469bcb" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_58f238ad09370f078bbae469bcb"`);
        await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_33f1dcdcdf132c3a113e8c4505d"`);
        await queryRunner.query(`ALTER TABLE "store_settings" ADD "mapsEmbedUrl" character varying(2000)`);
        await queryRunner.query(`DROP TABLE "plan_features"`);
        await queryRunner.query(`DROP TABLE "features"`);
    }

}
