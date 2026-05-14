import { MigrationInterface, QueryRunner } from "typeorm";

export class DecoupleUserTenant1778720554413 implements MigrationInterface {
    name = 'DecoupleUserTenant1778720554413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7346b08032078107fce81e014f"`);
        await queryRunner.query(`CREATE TYPE "public"."tenant_memberships_role_enum" AS ENUM('admin', 'staff')`);
        await queryRunner.query(`CREATE TABLE "tenant_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tenantId" uuid NOT NULL, "role" "public"."tenant_memberships_role_enum" NOT NULL DEFAULT 'admin', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_706d16104745b32d75df5836135" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eb04bbaf99aae176af0ff8a7fc" ON "tenant_memberships" ("userId", "tenantId") `);
        
        // =====================================================================
        // DATA MIGRATION: Preserve relationships and collapse duplicate users
        // =====================================================================
        
        // 1. Copy all current users mapping to the new bridge table
        await queryRunner.query(`INSERT INTO "tenant_memberships" ("userId", "tenantId", "role", "isActive") SELECT "id", "tenantId", CAST("role" AS varchar)::"public"."tenant_memberships_role_enum", "isActive" FROM "users"`);

        // 2. For identical emails across tenants, point their memberships to the single primary user record
        await queryRunner.query(`
          WITH UserGroups AS (
            SELECT "id", "email",
            FIRST_VALUE("id") OVER (PARTITION BY "email" ORDER BY "createdAt" ASC) as "primaryId"
            FROM "users"
          )
          UPDATE "tenant_memberships"
          SET "userId" = "primaryId"
          FROM UserGroups
          WHERE "tenant_memberships"."userId" = UserGroups."id"
        `);

        // 3. Delete the duplicate user records, keeping exactly one per email
        await queryRunner.query(`
          DELETE FROM "users"
          WHERE "id" NOT IN (
            SELECT DISTINCT ON ("email") "id"
            FROM "users"
            ORDER BY "email", "createdAt" ASC
          )
        `);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenantId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_aff7ff5f171848da8169885b857" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_f2a716ce4ea37745564baaccda3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_f2a716ce4ea37745564baaccda3"`);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_aff7ff5f171848da8169885b857"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb04bbaf99aae176af0ff8a7fc"`);
        await queryRunner.query(`DROP TABLE "tenant_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_memberships_role_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7346b08032078107fce81e014f" ON "users" ("email", "tenantId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
