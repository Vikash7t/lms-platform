import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesAndInstructorProfiles1732128000000
  implements MigrationInterface
{
  name = 'CreateCategoriesAndInstructorProfiles1732128000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(120) NOT NULL,
        "description" text,
        "iconName" character varying(50),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories" ("slug");
    `);

    // 2. Create instructor_profiles status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."instructor_profiles_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Create instructor_profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instructor_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "headline" character varying(100) NOT NULL,
        "bio" text NOT NULL,
        "websiteUrl" character varying(255),
        "twitterUrl" character varying(255),
        "linkedinUrl" character varying(255),
        "githubUrl" character varying(255),
        "status" "public"."instructor_profiles_status_enum" NOT NULL DEFAULT 'PENDING',
        "rejectionReason" text,
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_instructor_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_instructor_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_instructor_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_instructor_profiles_user_id" ON "instructor_profiles" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_instructor_profiles_status" ON "instructor_profiles" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_instructor_profiles_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_instructor_profiles_user_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "instructor_profiles";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."instructor_profiles_status_enum";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_categories_slug";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories";`);
  }
}
