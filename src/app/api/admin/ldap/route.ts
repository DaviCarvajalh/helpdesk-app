import { NextRequest, NextResponse } from "next/server";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";
import { authenticateWithLdap, getLdapConfig } from "@/lib/ldap";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role !== ROLES.ADMIN) throw new ForbiddenError("Solo administradores");

    const row = await prisma.sysConfig.findUnique({ where: { id: "main" } });
    const db  = (row?.ldap ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      enabled:         !!(db.enabled),
      url:             (db.url             as string) || "",
      domain:          (db.domain          as string) || "",
      baseDn:          (db.baseDn          as string) || "",
      bindDn:          (db.bindDn          as string) || "",
      hasPassword:     !!(db.bindPasswordEnc),
      groupAdmin:      (db.groupAdmin      as string) || "",
      groupSupervisor: (db.groupSupervisor as string) || "",
      groupTecnico:    (db.groupTecnico    as string) || "",
      groupAuditor:    (db.groupAuditor    as string) || "",
      roleDefault:     (db.roleDefault     as string) || "Usuario Final",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== ROLES.ADMIN) throw new ForbiddenError("Solo administradores");

    const body = await req.json();

    // Lee la config actual para preservar el password si no se envía uno nuevo
    const row    = await prisma.sysConfig.findUnique({ where: { id: "main" } });
    const current = (row?.ldap ?? {}) as Record<string, unknown>;

    let bindPasswordEnc = current.bindPasswordEnc as string | undefined;
    let bindPasswordIv  = current.bindPasswordIv  as string | undefined;

    if (body.bindPassword && body.bindPassword.trim() !== "") {
      const { encrypted, iv } = encrypt(body.bindPassword.trim());
      bindPasswordEnc = encrypted;
      bindPasswordIv  = iv;
    }

    const ldap = {
      enabled:         !!body.enabled,
      url:             body.url             ?? "",
      domain:          body.domain          ?? "",
      baseDn:          body.baseDn          ?? "",
      bindDn:          body.bindDn          ?? "",
      bindPasswordEnc,
      bindPasswordIv,
      groupAdmin:      body.groupAdmin      ?? "",
      groupSupervisor: body.groupSupervisor ?? "",
      groupTecnico:    body.groupTecnico    ?? "",
      groupAuditor:    body.groupAuditor    ?? "",
      roleDefault:     body.roleDefault     ?? "Usuario Final",
    };

    await prisma.sysConfig.upsert({
      where:  { id: "main" },
      create: { id: "main", ldap, updatedBy: session.userId },
      update: { ldap, updatedBy: session.userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[LDAP PATCH]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== ROLES.ADMIN) throw new ForbiddenError("Solo administradores");

    const { testUser, testPassword } = await req.json();
    if (!testUser || !testPassword)
      return NextResponse.json({ message: "Usuario y contraseña requeridos" }, { status: 400 });

    const config = await getLdapConfig();
    if (!config.enabled)
      return NextResponse.json({ ok: false, message: "LDAP no está habilitado" });

    const result = await authenticateWithLdap(testUser, testPassword, config);
    if (!result) return NextResponse.json({ ok: false, message: "Autenticación fallida o LDAP no configurado" });

    return NextResponse.json({
      ok: true,
      message: "Conexión exitosa",
      user: {
        account: result.sAMAccountName,
        mail:    result.mail,
        name:    `${result.givenName} ${result.sn}`.trim(),
        groups:  result.memberOf.length,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[LDAP TEST]", error);
    return NextResponse.json({ ok: false, message: `Error: ${error instanceof Error ? error.message : "desconocido"}` });
  }
}
