import { MigrationInterface, QueryRunner } from "typeorm";

export class PlatformAdminCore1781114172671 implements MigrationInterface {
    name = 'PlatformAdminCore1781114172671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "maxProducts" integer NOT NULL, "maxCategories" integer NOT NULL, "maxStaffUsers" integer NOT NULL, "maxImages" integer NOT NULL, "isHidden" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_253d25dae4c94ee913bc5ec4850" UNIQUE ("name"), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."platform_audit_logs_action_enum" AS ENUM('TENANT_CREATED', 'TENANT_SUSPENDED', 'TENANT_REACTIVATED', 'TENANT_PLAN_CHANGED', 'IMPERSONATION_STARTED', 'IMPERSONATION_ENDED', 'IMPERSONATION_PRODUCT_CREATED', 'IMPERSONATION_PRODUCT_UPDATED', 'IMPERSONATION_PRODUCT_DELETED', 'IMPERSONATION_CATEGORY_CREATED', 'IMPERSONATION_CATEGORY_UPDATED', 'IMPERSONATION_CATEGORY_DELETED', 'PLATFORM_LOGIN', 'PLATFORM_LOGIN_FAILED', 'PLATFORM_LOGOUT')`);
        await queryRunner.query(`CREATE TABLE "platform_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" character varying NOT NULL, "action" "public"."platform_audit_logs_action_enum" NOT NULL, "onBehalfOfTenantId" character varying, "details" jsonb, "ipAddress" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_df9143ce2f97b20833a989e1e8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "platform_admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedAt" TIMESTAMP WITH TIME ZONE, "totpSecret" character varying, "isMfaEnabled" boolean NOT NULL DEFAULT false, "refreshTokenHash" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7ddfa7abfaf477f671ccc566c83" UNIQUE ("email"), CONSTRAINT "PK_faecb3398d1962507b44c76e4f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "impersonation_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "platformAdminId" character varying NOT NULL, "tenantId" character varying NOT NULL, "used" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bafea64d54727f4168205068ef2" UNIQUE ("code"), CONSTRAINT "PK_f434d3806795096a9618ec0bfde" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'suspended', 'inactive')`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "suspensionReason" character varying`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "suspendedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "planId" uuid`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "planGraceUntil" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "FK_bf4b8434d205b4a051fa0c89aa3" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_bf4b8434d205b4a051fa0c89aa3"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "planGraceUntil"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "planId"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "suspendedAt"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "suspensionReason"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
        await queryRunner.query(`DROP TABLE "impersonation_codes"`);
        await queryRunner.query(`DROP TABLE "platform_admins"`);
        await queryRunner.query(`DROP TABLE "platform_audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."platform_audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "plans"`);
    }

}
