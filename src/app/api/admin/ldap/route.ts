import { NextRequest, NextResponse } from "next/server";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";
import { authenticateWithLdap } from "@/lib/ldap";

function masked(val: string | undefined) {
  if (!val) return null;
  if (val.length <= 4) return "****";
  return val.slice(0, 2) + "*".repeat(val.length - 4) + val.slice(-2);
}

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role !== ROLES.ADMIN) throw new ForbiddenError("Solo administradores");

    const vars = {
      LDAP_ENABLED:          process.env.LDAP_ENABLED ?? null,
      LDAP_URL:              process.env.LDAP_URL ?? null,
      LDAP_DOMAIN:           process.env.LDAP_DOMAIN ?? null,
      LDAP_BASE_DN:          process.env.LDAP_BASE_DN ?? null,
      LDAP_BIND_DN:          process.env.LDAP_BIND_DN ?? null,
      LDAP_BIND_PASSWORD:    process.env.LDAP_BIND_PASSWORD ? masked(process.env.LDAP_BIND_PASSWORD) : null,
      LDAP_GROUP_ADMIN:      process.env.LDAP_GROUP_ADMIN ?? null,
      LDAP_GROUP_SUPERVISOR: process.env.LDAP_GROUP_SUPERVISOR ?? null,
      LDAP_GROUP_TECNICO:    process.env.LDAP_GROUP_TECNICO ?? null,
      LDAP_GROUP_AUDITOR:    process.env.LDAP_GROUP_AUDITOR ?? null,
      LDAP_ROLE_DEFAULT:     process.env.LDAP_ROLE_DEFAULT ?? null,
    };

    const configured = !!(
      process.env.LDAP_URL &&
      process.env.LDAP_BASE_DN &&
      process.env.LDAP_BIND_DN &&
      process.env.LDAP_BIND_PASSWORD &&
      process.env.LDAP_DOMAIN
    );

    return NextResponse.json({ vars, configured, enabled: process.env.LDAP_ENABLED === "true" });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
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

    if (process.env.LDAP_ENABLED !== "true")
      return NextResponse.json({ ok: false, message: "LDAP no está habilitado (LDAP_ENABLED != true)" });

    const result = await authenticateWithLdap(testUser, testPassword);

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
