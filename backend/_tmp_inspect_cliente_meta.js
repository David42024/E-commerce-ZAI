const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const tableType = await prisma.$queryRaw`SELECT table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cli_clientes'`;
  const relInfo = await prisma.$queryRaw`SELECT relkind, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'cli_clientes'`;
  const rules = await prisma.$queryRaw`SELECT rulename, definition FROM pg_rules WHERE schemaname = 'public' AND tablename = 'cli_clientes'`;
  const policies = await prisma.$queryRaw`SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cli_clientes'`;

  console.log(JSON.stringify({ tableType, relInfo, rules, policies }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
