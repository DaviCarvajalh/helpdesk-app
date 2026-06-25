-- CreateTable
CREATE TABLE "sec_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sec_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sec_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,

    CONSTRAINT "sec_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sec_credential" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "encryption_iv" TEXT NOT NULL,
    "url" TEXT,
    "asset_id" TEXT,
    "owner_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_by" TEXT,

    CONSTRAINT "sec_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sec_credential_access" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'view',
    "ip_address" TEXT,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_credential_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfg_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "cfg_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfg_priority" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "resolve_time" INTEGER NOT NULL,
    "color" TEXT,

    CONSTRAINT "cfg_priority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfg_status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cfg_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfg_sla" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority_id" TEXT NOT NULL,
    "response_time_h" INTEGER NOT NULL,
    "resolve_time_h" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cfg_sla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hd_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_contract" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "hd_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_ticket" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "category_id" TEXT,
    "priority_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "sla_deadline" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "hd_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_ticket_comment" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hd_ticket_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_ticket_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_asset" (
    "id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "category_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "assigned_to" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_end" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "inv_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_infra_asset" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "ip_address" TEXT,
    "operating_system" TEXT,
    "environment" TEXT,
    "owner_id" TEXT,
    "criticality" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inv_infra_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "kb_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" TEXT,
    "author_id" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "kb_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aud_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aud_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sec_role_name_key" ON "sec_role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sec_user_email_key" ON "sec_user"("email");

-- CreateIndex
CREATE INDEX "idx_sec_user_email" ON "sec_user"("email");

-- CreateIndex
CREATE INDEX "idx_sec_user_role_id" ON "sec_user"("role_id");

-- CreateIndex
CREATE INDEX "idx_sec_credential_owner_id" ON "sec_credential"("owner_id");

-- CreateIndex
CREATE INDEX "idx_sec_credential_access_credential_id" ON "sec_credential_access"("credential_id");

-- CreateIndex
CREATE INDEX "idx_sec_credential_access_user_id" ON "sec_credential_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cfg_category_name_key" ON "cfg_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cfg_priority_name_key" ON "cfg_priority"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cfg_status_name_key" ON "cfg_status"("name");

-- CreateIndex
CREATE INDEX "idx_cfg_sla_priority_id" ON "cfg_sla"("priority_id");

-- CreateIndex
CREATE UNIQUE INDEX "hd_customer_tax_id_key" ON "hd_customer"("tax_id");

-- CreateIndex
CREATE INDEX "idx_hd_customer_tax_id" ON "hd_customer"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "hd_contract_contract_number_key" ON "hd_contract"("contract_number");

-- CreateIndex
CREATE INDEX "idx_hd_contract_customer_id" ON "hd_contract"("customer_id");

-- CreateIndex
CREATE INDEX "idx_hd_contract_end_date" ON "hd_contract"("end_date");

-- CreateIndex
CREATE UNIQUE INDEX "hd_ticket_ticket_number_key" ON "hd_ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_requester_id" ON "hd_ticket"("requester_id");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_assignee_id" ON "hd_ticket"("assignee_id");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_status_id" ON "hd_ticket"("status_id");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_priority_id" ON "hd_ticket"("priority_id");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_created_at" ON "hd_ticket"("created_at");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_sla_deadline" ON "hd_ticket"("sla_deadline");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_comment_ticket_id" ON "hd_ticket_comment"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_hd_ticket_history_ticket_id" ON "hd_ticket_history"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "inv_asset_asset_code_key" ON "inv_asset"("asset_code");

-- CreateIndex
CREATE INDEX "idx_inv_asset_code" ON "inv_asset"("asset_code");

-- CreateIndex
CREATE INDEX "idx_inv_asset_assigned_to" ON "inv_asset"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_inv_infra_asset_hostname" ON "inv_infra_asset"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "kb_category_name_key" ON "kb_category"("name");

-- CreateIndex
CREATE INDEX "idx_kb_article_category_id" ON "kb_article"("category_id");

-- CreateIndex
CREATE INDEX "idx_kb_article_author_id" ON "kb_article"("author_id");

-- CreateIndex
CREATE INDEX "idx_aud_log_user_id" ON "aud_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_aud_log_entity" ON "aud_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "idx_aud_log_created_at" ON "aud_log"("created_at");

-- AddForeignKey
ALTER TABLE "sec_user" ADD CONSTRAINT "sec_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sec_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sec_credential" ADD CONSTRAINT "sec_credential_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sec_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sec_credential_access" ADD CONSTRAINT "sec_credential_access_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "sec_credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cfg_sla" ADD CONSTRAINT "cfg_sla_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "cfg_priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_contract" ADD CONSTRAINT "hd_contract_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "hd_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket" ADD CONSTRAINT "hd_ticket_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "sec_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket" ADD CONSTRAINT "hd_ticket_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "sec_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket" ADD CONSTRAINT "hd_ticket_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cfg_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket" ADD CONSTRAINT "hd_ticket_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "cfg_priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket" ADD CONSTRAINT "hd_ticket_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "cfg_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket_comment" ADD CONSTRAINT "hd_ticket_comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "hd_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket_comment" ADD CONSTRAINT "hd_ticket_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sec_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_ticket_history" ADD CONSTRAINT "hd_ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "hd_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_article" ADD CONSTRAINT "kb_article_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "kb_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_article" ADD CONSTRAINT "kb_article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "sec_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aud_log" ADD CONSTRAINT "aud_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sec_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
