import { Client } from "ldapts";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export interface LdapUser {
  dn: string;
  sAMAccountName: string;
  mail: string;
  givenName: string;
  sn: string;
  memberOf: string[];
}

export interface LdapConfig {
  enabled:         boolean;
  url:             string;
  domain:          string;
  baseDn:          string;
  bindDn:          string;
  bindPassword:    string;
  groupAdmin:      string;
  groupSupervisor: string;
  groupTecnico:    string;
  groupAuditor:    string;
  roleDefault:     string;
}

/**
 * Lee la config LDAP desde la DB (con fallback a variables de entorno).
 */
export async function getLdapConfig(): Promise<LdapConfig> {
  try {
    const row = await prisma.sysConfig.findUnique({ where: { id: "main" } });
    const db  = (row?.ldap ?? {}) as Record<string, unknown>;

    if (db.url) {
      let bindPassword = "";
      if (db.bindPasswordEnc && db.bindPasswordIv) {
        try { bindPassword = decrypt(db.bindPasswordEnc as string, db.bindPasswordIv as string); }
        catch { bindPassword = ""; }
      }
      return {
        enabled:         !!(db.enabled),
        url:             (db.url             as string) || "",
        domain:          (db.domain          as string) || "",
        baseDn:          (db.baseDn          as string) || "",
        bindDn:          (db.bindDn          as string) || "",
        bindPassword,
        groupAdmin:      (db.groupAdmin      as string) || "",
        groupSupervisor: (db.groupSupervisor as string) || "",
        groupTecnico:    (db.groupTecnico    as string) || "",
        groupAuditor:    (db.groupAuditor    as string) || "",
        roleDefault:     (db.roleDefault     as string) || "Usuario Final",
      };
    }
  } catch { /* fallback a env */ }

  // Fallback a variables de entorno
  return {
    enabled:         process.env.LDAP_ENABLED === "true",
    url:             process.env.LDAP_URL             || "",
    domain:          process.env.LDAP_DOMAIN          || "",
    baseDn:          process.env.LDAP_BASE_DN         || "",
    bindDn:          process.env.LDAP_BIND_DN         || "",
    bindPassword:    process.env.LDAP_BIND_PASSWORD   || "",
    groupAdmin:      process.env.LDAP_GROUP_ADMIN      || "",
    groupSupervisor: process.env.LDAP_GROUP_SUPERVISOR || "",
    groupTecnico:    process.env.LDAP_GROUP_TECNICO    || "",
    groupAuditor:    process.env.LDAP_GROUP_AUDITOR    || "",
    roleDefault:     process.env.LDAP_ROLE_DEFAULT     || "Usuario Final",
  };
}

/**
 * Mapea los grupos AD del usuario a un rol del sistema.
 */
export function mapLdapGroupsToRole(memberOf: string[], config?: LdapConfig): string {
  const groups = memberOf.map((g) => g.toLowerCase());
  const check = (val: string | undefined) =>
    val ? groups.some((g) => g.includes(val.toLowerCase())) : false;

  if (config) {
    if (check(config.groupAdmin))      return "Administrador";
    if (check(config.groupSupervisor)) return "Supervisor";
    if (check(config.groupTecnico))    return "Técnico";
    if (check(config.groupAuditor))    return "Auditor";
    return config.roleDefault || "Usuario Final";
  }

  if (check(process.env.LDAP_GROUP_ADMIN))      return "Administrador";
  if (check(process.env.LDAP_GROUP_SUPERVISOR)) return "Supervisor";
  if (check(process.env.LDAP_GROUP_TECNICO))    return "Técnico";
  if (check(process.env.LDAP_GROUP_AUDITOR))    return "Auditor";
  return process.env.LDAP_ROLE_DEFAULT ?? "Usuario Final";
}

/**
 * Autentica un usuario contra Active Directory.
 * Acepta config explícita o lee desde DB/env si no se provee.
 */
export async function authenticateWithLdap(
  username: string,
  password: string,
  config?: LdapConfig
): Promise<LdapUser | null> {
  const cfg = config ?? await getLdapConfig();
  if (!cfg.enabled || !cfg.url || !cfg.baseDn || !cfg.bindDn || !cfg.bindPassword || !cfg.domain)
    return null;

  const url     = cfg.url;
  const baseDn  = cfg.baseDn;
  const domain  = cfg.domain;
  const bindDn  = cfg.bindDn;
  const bindPwd = cfg.bindPassword;

  // Normalizar username: acepta "user", "DOMAIN\user" o "user@domain.com"
  const samAccount = username.includes("\\")
    ? username.split("\\").pop()!
    : username.includes("@")
    ? username.split("@")[0]
    : username;

  const userPrincipal = username.includes("@")
    ? username
    : `${samAccount}@${domain}`;

  // 1) Bind con las credenciales del usuario para verificar contraseña
  const userClient = new Client({
    url,
    tlsOptions: { rejectUnauthorized: false },
    connectTimeout: 5000,
  });

  try {
    await userClient.bind(userPrincipal, password);
  } catch (err) {
    console.warn("[LDAP] Bind fallido para:", userPrincipal, err instanceof Error ? err.message : err);
    return null;
  } finally {
    await userClient.unbind().catch(() => {});
  }

  // 2) Bind con cuenta de servicio para buscar atributos del usuario
  const serviceClient = new Client({
    url,
    tlsOptions: { rejectUnauthorized: false },
    connectTimeout: 5000,
  });

  try {
    await serviceClient.bind(bindDn, bindPwd);

    const { searchEntries } = await serviceClient.search(baseDn, {
      scope: "sub",
      filter: `(|(userPrincipalName=${userPrincipal})(sAMAccountName=${samAccount}))`,
      attributes: ["sAMAccountName", "mail", "givenName", "sn", "memberOf"],
      timeLimit: 10,
    });

    if (searchEntries.length === 0) {
      console.warn("[LDAP] Usuario autenticado pero no encontrado en búsqueda:", samAccount);
      return null;
    }

    const entry = searchEntries[0];

    const raw = (key: string) => {
      const v = entry[key];
      if (Array.isArray(v)) return v[0] as string ?? "";
      return (v as string) ?? "";
    };

    const rawGroups = entry["memberOf"];
    const memberOf = Array.isArray(rawGroups)
      ? (rawGroups as string[])
      : rawGroups
      ? [rawGroups as string]
      : [];

    return {
      dn: entry.dn,
      sAMAccountName: raw("sAMAccountName") || samAccount,
      mail: raw("mail") || `${samAccount}@${domain}`,
      givenName: raw("givenName") || samAccount,
      sn: raw("sn") || "",
      memberOf,
    };
  } catch (err) {
    console.error("[LDAP] Error en búsqueda de usuario:", err);
    return null;
  } finally {
    await serviceClient.unbind().catch(() => {});
  }
}
