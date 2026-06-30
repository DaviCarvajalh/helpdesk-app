-- CreateTable
CREATE TABLE "kb_procedure" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "kb_procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_procedure_step" (
    "id" TEXT NOT NULL,
    "procedure_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "is_warning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "kb_procedure_step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_kb_procedure_category" ON "kb_procedure"("category");

-- CreateIndex
CREATE INDEX "idx_kb_procedure_step_procedure_id" ON "kb_procedure_step"("procedure_id");

-- AddForeignKey
ALTER TABLE "kb_procedure_step" ADD CONSTRAINT "kb_procedure_step_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "kb_procedure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
