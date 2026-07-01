import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── sec_role ────────────────────────────────────────
  const roles = await Promise.all([
    prisma.secRole.upsert({
      where: { name: "Administrador" },
      update: {},
      create: { name: "Administrador", description: "Acceso total al sistema" },
    }),
    prisma.secRole.upsert({
      where: { name: "Supervisor" },
      update: {},
      create: { name: "Supervisor", description: "Gestión de equipos y reportes" },
    }),
    prisma.secRole.upsert({
      where: { name: "Técnico" },
      update: {},
      create: { name: "Técnico", description: "Resolución de tickets" },
    }),
    prisma.secRole.upsert({
      where: { name: "Usuario Final" },
      update: {},
      create: { name: "Usuario Final", description: "Creación y seguimiento de tickets propios" },
    }),
    prisma.secRole.upsert({
      where: { name: "Auditor" },
      update: {},
      create: { name: "Auditor", description: "Acceso de solo lectura" },
    }),
  ]);
  console.log(`✅ ${roles.length} roles creados`);

  // ── cfg_priority ────────────────────────────────────
  const priorities = await Promise.all([
    prisma.cfgPriority.upsert({
      where: { name: "Crítica" },
      update: {},
      create: { name: "Crítica", level: 4, responseTime: 15, resolveTime: 240, color: "#ef4444" },
    }),
    prisma.cfgPriority.upsert({
      where: { name: "Alta" },
      update: {},
      create: { name: "Alta", level: 3, responseTime: 30, resolveTime: 480, color: "#f97316" },
    }),
    prisma.cfgPriority.upsert({
      where: { name: "Media" },
      update: {},
      create: { name: "Media", level: 2, responseTime: 240, resolveTime: 1440, color: "#eab308" },
    }),
    prisma.cfgPriority.upsert({
      where: { name: "Baja" },
      update: {},
      create: { name: "Baja", level: 1, responseTime: 480, resolveTime: 4320, color: "#22c55e" },
    }),
  ]);
  console.log(`✅ ${priorities.length} prioridades creadas`);

  // ── cfg_status ──────────────────────────────────────
  const statuses = await Promise.all([
    prisma.cfgStatus.upsert({
      where: { name: "Nuevo" },
      update: {},
      create: { name: "Nuevo", color: "#3b82f6" },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "Asignado" },
      update: {},
      create: { name: "Asignado", color: "#8b5cf6" },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "En Proceso" },
      update: {},
      create: { name: "En Proceso", color: "#f97316" },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "Pendiente Cliente" },
      update: {},
      create: { name: "Pendiente Cliente", color: "#eab308" },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "Pendiente Proveedor" },
      update: {},
      create: { name: "Pendiente Proveedor", color: "#6366f1" },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "Resuelto" },
      update: {},
      create: { name: "Resuelto", color: "#10b981", isClosed: true },
    }),
    prisma.cfgStatus.upsert({
      where: { name: "Cerrado" },
      update: {},
      create: { name: "Cerrado", color: "#6b7280", isClosed: true },
    }),
  ]);
  console.log(`✅ ${statuses.length} estados creados`);

  // ── cfg_category ────────────────────────────────────
  const categoryNames = [
    "Hardware", "Software", "Red", "Accesos",
    "Impresoras", "Correo", "Servidor", "Telefonía",
  ];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.cfgCategory.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log(`✅ ${categories.length} categorías creadas`);

  // ── sec_user (admin) ────────────────────────────────
  const adminRole    = roles.find((r) => r.name === "Administrador")!;
  const adminEmail   = process.env.ADMIN_EMAIL    ?? "admin@helpdesk.cl";
  const adminPwd     = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  const hashedPassword = await bcrypt.hash(adminPwd, 12);

  const admin = await prisma.secUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      lastname: "HelpDesk",
      email: adminEmail,
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
  });
  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // ── hd_customer ─────────────────────────────────────
  const customerNames = [
    "Ignisterra", "ETL Technology", "Hospital de Melipilla",
    "Hospital de Ñuble", "Maderas Concón", "Russfin",
  ];
  let createdCustomers = 0;
  for (const name of customerNames) {
    const exists = await prisma.hdCustomer.findFirst({ where: { name } });
    if (!exists) {
      await prisma.hdCustomer.create({ data: { name } });
      createdCustomers++;
    }
  }
  console.log(`✅ ${createdCustomers} clientes creados`);

  console.log("\n🚀 Seed completado exitosamente!");
  console.log("📧 Login: admin@helpdesk.cl");
  console.log("🔑 Password: Admin1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
