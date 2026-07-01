import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { authenticateWithLdap, mapLdapGroupsToRole, getLdapConfig } from "@/lib/ldap";

// Acepta email completo o usuario de red (ej: "jperez" o "DOMINIO\jperez")
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  remember: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: identifier, password, remember } = loginSchema.parse(body);

    const tokenExpiresIn = remember ? "30d" : (process.env.JWT_EXPIRES_IN ?? "8h");
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;

    // ─── Intento LDAP (si está habilitado) ─────────────────────────────
    const ldapCfg = await getLdapConfig();
    if (ldapCfg.enabled) {
      const ldapUser = await authenticateWithLdap(identifier, password, ldapCfg);

      if (ldapUser) {
        // Auto-provisionar o recuperar usuario en la DB
        let dbUser = await prisma.secUser.findUnique({
          where: { email: ldapUser.mail },
          include: { role: true },
        });

        if (!dbUser) {
          // Primer login con AD: crear usuario
          const roleName = mapLdapGroupsToRole(ldapUser.memberOf, ldapCfg);
          const role = await prisma.secRole.findUnique({ where: { name: roleName } });

          if (!role) {
            console.error("[LDAP] Rol no encontrado en DB:", roleName);
            return NextResponse.json({ message: "Error de configuración de roles" }, { status: 500 });
          }

          dbUser = await prisma.secUser.create({
            data: {
              name: ldapUser.givenName || ldapUser.sAMAccountName,
              lastname: ldapUser.sn || "",
              email: ldapUser.mail,
              passwordHash: await bcrypt.hash(crypto.randomUUID(), 12), // password local inutilizable
              roleId: role.id,
              isActive: true,
            },
            include: { role: true },
          });

          console.info("[LDAP] Usuario auto-provisionado:", dbUser.email);
        } else if (!dbUser.isActive) {
          return NextResponse.json({ message: "Cuenta desactivada" }, { status: 401 });
        } else {
          // Sincronizar rol con AD en cada login
          const roleName = mapLdapGroupsToRole(ldapUser.memberOf, ldapCfg);
          const role = await prisma.secRole.findUnique({ where: { name: roleName } });
          if (role && role.id !== dbUser.roleId) {
            await prisma.secUser.update({
              where: { id: dbUser.id },
              data: { roleId: role.id },
            });
            dbUser = { ...dbUser, role, roleId: role.id };
          }
        }

        const token = signToken({
          userId: dbUser.id,
          email: dbUser.email,
          role: dbUser.role.name,
          name: `${dbUser.name} ${dbUser.lastname}`.trim(),
        }, tokenExpiresIn);

        const response = NextResponse.json({
          message: "Login exitoso",
          user: { id: dbUser.id, name: dbUser.name, lastname: dbUser.lastname, email: dbUser.email, role: dbUser.role.name },
        });

        response.cookies.set("hd_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge,
          path: "/",
        });

        return response;
      }
      // Si LDAP falla → continúa con auth local
      console.info("[LDAP] Sin respuesta, intentando auth local para:", identifier);
    }

    // ─── Auth local ────────────────────────────────────────────────────
    // Para auth local, el identifier debe ser un email válido
    const emailResult = z.string().email().safeParse(identifier);
    if (!emailResult.success) {
      return NextResponse.json({ message: "Credenciales incorrectas" }, { status: 401 });
    }

    const user = await prisma.secUser.findUnique({
      where: { email: identifier },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      name: `${user.name} ${user.lastname}`,
    }, tokenExpiresIn);

    const response = NextResponse.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role.name,
      },
    });

    response.cookies.set("hd_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: error.issues },
        { status: 400 }
      );
    }
    console.error("[LOGIN]", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
