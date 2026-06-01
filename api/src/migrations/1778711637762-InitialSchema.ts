import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1778711637762 implements MigrationInterface {
    name = 'InitialSchema1778711637762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2310ecc5cb8be427097154b18f" ON "tenants" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_deliverymethod_enum" AS ENUM('delivery', 'takeaway', 'in_store')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentmethod_enum" AS ENUM('cash', 'transfer', 'card', 'other')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "orderNumber" character varying(50) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "deliveryMethod" "public"."orders_deliverymethod_enum" NOT NULL, "paymentMethod" "public"."orders_paymentmethod_enum" NOT NULL, "subtotal" integer NOT NULL, "deliveryCost" integer NOT NULL DEFAULT '0', "total" integer NOT NULL, "customerInfo" jsonb NOT NULL, "notes" text, "internalNotes" text, "verifiedWhatsappNumber" character varying(50), "statusHistory" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c2cfc2bf7cb89228185e15644c" ON "orders" ("tenantId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2320894752c92ce150ff491241" ON "orders" ("tenantId", "status") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid NOT NULL, "productName" character varying(255) NOT NULL, "unitPrice" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "selectedOptions" jsonb NOT NULL DEFAULT '[]', "itemNote" text, "subtotal" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "store_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "description" text, "logoUrl" text, "phone" character varying(50), "whatsapp" character varying(50), "address" text, "schedule" jsonb, "timezone" character varying(100) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires', "primaryColor" character varying(7) NOT NULL DEFAULT '#000000', "accentColor" character varying(7) NOT NULL DEFAULT '#ffffff', "backgroundColor" character varying(7) NOT NULL DEFAULT '#ffffff', "deliveryEnabled" boolean NOT NULL DEFAULT false, "deliveryCost" integer NOT NULL DEFAULT '0', "deliveryMinOrder" integer NOT NULL DEFAULT '0', "takeawayEnabled" boolean NOT NULL DEFAULT true, "inStoreEnabled" boolean NOT NULL DEFAULT false, "cashEnabled" boolean NOT NULL DEFAULT true, "transferEnabled" boolean NOT NULL DEFAULT false, "transferAlias" character varying(100), "cardEnabled" boolean NOT NULL DEFAULT false, "isManualOpen" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_04134efffeb3c7e14ab91d44cfc" UNIQUE ("tenantId"), CONSTRAINT "REL_04134efffeb3c7e14ab91d44cf" UNIQUE ("tenantId"), CONSTRAINT "PK_4da44f346b360f378f1489b6199" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_04134efffeb3c7e14ab91d44cf" ON "store_settings" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "imageUrl" text, "order" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59b20a0e533a340fb6016cba5f" ON "categories" ("tenantId", "order") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "categoryId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "price" integer NOT NULL, "imageUrl" text, "isFeatured" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4dd1b85bcfc67fc32d5fd96b71" ON "products" ("tenantId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_60641843a69bd415aa8840e30f" ON "products" ("tenantId", "categoryId") `);
        await queryRunner.query(`CREATE TYPE "public"."option_groups_type_enum" AS ENUM('radio', 'checkbox')`);
        await queryRunner.query(`CREATE TABLE "option_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."option_groups_type_enum" NOT NULL DEFAULT 'radio', "isRequired" boolean NOT NULL DEFAULT false, "minSelections" integer NOT NULL DEFAULT '0', "maxSelections" integer NOT NULL DEFAULT '1', "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5078ac50f999db2431883a4dfb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "option_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "optionGroupId" uuid NOT NULL, "name" character varying(255) NOT NULL, "priceModifier" integer NOT NULL DEFAULT '0', "isDefault" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_00c5489b6b980d1e7242bae68fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'staff')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin', "refreshToken" text, "resetPasswordToken" character varying(255), "resetPasswordExpiresAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TYPE "public"."tenant_memberships_role_enum" AS ENUM('admin', 'staff')`);
        await queryRunner.query(`CREATE TABLE "tenant_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tenantId" uuid NOT NULL, "role" "public"."tenant_memberships_role_enum" NOT NULL DEFAULT 'admin', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_706d16104745b32d75df5836135" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eb04bbaf99aae176af0ff8a7fc" ON "tenant_memberships" ("userId", "tenantId") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_208a358e9fe8abe6e1d82459804" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_settings" ADD CONSTRAINT "FK_04134efffeb3c7e14ab91d44cfc" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_46a85229c9953b2b94f768190b2" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_6804855ba1a19523ea57e0769b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "option_groups" ADD CONSTRAINT "FK_76755498d6a8232e737ca1136c6" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "option_items" ADD CONSTRAINT "FK_4cb7c5e59e2ed20ec4be9756a46" FOREIGN KEY ("optionGroupId") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_aff7ff5f171848da8169885b857" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" ADD CONSTRAINT "FK_f2a716ce4ea37745564baaccda3" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_f2a716ce4ea37745564baaccda3"`);
        await queryRunner.query(`ALTER TABLE "tenant_memberships" DROP CONSTRAINT "FK_aff7ff5f171848da8169885b857"`);
        await queryRunner.query(`ALTER TABLE "option_items" DROP CONSTRAINT "FK_4cb7c5e59e2ed20ec4be9756a46"`);
        await queryRunner.query(`ALTER TABLE "option_groups" DROP CONSTRAINT "FK_76755498d6a8232e737ca1136c6"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_6804855ba1a19523ea57e0769b4"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_46a85229c9953b2b94f768190b2"`);
        await queryRunner.query(`ALTER TABLE "store_settings" DROP CONSTRAINT "FK_04134efffeb3c7e14ab91d44cfc"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_208a358e9fe8abe6e1d82459804"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb04bbaf99aae176af0ff8a7fc"`);
        await queryRunner.query(`DROP TABLE "tenant_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_memberships_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "option_items"`);
        await queryRunner.query(`DROP TABLE "option_groups"`);
        await queryRunner.query(`DROP TYPE "public"."option_groups_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60641843a69bd415aa8840e30f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4dd1b85bcfc67fc32d5fd96b71"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59b20a0e533a340fb6016cba5f"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04134efffeb3c7e14ab91d44cf"`);
        await queryRunner.query(`DROP TABLE "store_settings"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2320894752c92ce150ff491241"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c2cfc2bf7cb89228185e15644c"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_deliverymethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2310ecc5cb8be427097154b18f"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }
}
