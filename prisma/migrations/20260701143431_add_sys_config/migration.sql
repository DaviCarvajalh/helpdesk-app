-- CreateTable
CREATE TABLE "sys_config" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "ldap" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("id")
);
