-- AlterTable: add credit fields to cli_clientes
ALTER TABLE "public"."cli_clientes"
  ADD COLUMN IF NOT EXISTS "limite_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "saldo_deudor"   DECIMAL(12,2) NOT NULL DEFAULT 0;
