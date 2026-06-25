import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";

export const ROLES = {
  ADMIN:      "Administrador",
  SUPERVISOR: "Supervisor",
  TECNICO:    "Técnico",
  USUARIO:    "Usuario Final",
  AUDITOR:    "Auditor",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Sin permiso para esta acción") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getSession(): Promise<JwtPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("hd_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<JwtPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireRole(allowedRoles: RoleName[]): Promise<JwtPayload> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role as RoleName)) {
    throw new ForbiddenError(`Rol '${session.role}' no tiene permiso para esta operación`);
  }
  return session;
}
