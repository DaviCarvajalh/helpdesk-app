-- CreateTable
CREATE TABLE "sec_password_reset_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sec_password_reset_token_token_key" ON "sec_password_reset_token"("token");

-- CreateIndex
CREATE INDEX "idx_sec_pwd_reset_token" ON "sec_password_reset_token"("token");

-- CreateIndex
CREATE INDEX "idx_sec_pwd_reset_user_id" ON "sec_password_reset_token"("user_id");

-- AddForeignKey
ALTER TABLE "sec_password_reset_token" ADD CONSTRAINT "sec_password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sec_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
