import { Client } from "ldapts";

export interface LdapUser {
  dn: string;
  sAMAccountName: string;
  mail: string;
  givenName: string;
  sn: string;
  memberOf: string[];
}

function isLdapConfigured(): boolean {
  return !!(
    process.env.LDAP_URL &&
    process.env.LDAP_BASE_DN &&
    process.env.LDAP_BIND_DN &&
    process.env.LDAP_BIND_PASSWORD &&
    process.env.LDAP_DOMAIN
  );
}

/**
 * Mapea los grupos AD del usuario a un rol del sistema.
 * Busca coincidencia en orden de prioridad descendente.
 */
export function mapLdapGroupsToRole(memberOf: string[]): string {
  const groups = memberOf.map((g) => g.toLowerCase());

  const check = (envVar: string | undefined) =>
    envVar ? groups.some((g) => g.includes(envVar.toLowerCase())) : false;

  if (check(process.env.LDAP_GROUP_ADMIN))      return "Administrador";
  if (check(process.env.LDAP_GROUP_SUPERVISOR)) return "Supervisor";
  if (check(process.env.LDAP_GROUP_TECNICO))    return "Técnico";
  if (check(process.env.LDAP_GROUP_AUDITOR))    return "Auditor";

  return process.env.LDAP_ROLE_DEFAULT ?? "Usuario Final";
}

/**
 * Autentica un usuario contra Active Directory.
 * Retorna los datos del usuario o null si falla.
 */
export async function authenticateWithLdap(
  username: string,
  password: string
): Promise<LdapUser | null> {
  if (!isLdapConfigured()) return null;

  const url        = process.env.LDAP_URL!;
  const baseDn     = process.env.LDAP_BASE_DN!;
  const domain     = process.env.LDAP_DOMAIN!;
  const bindDn     = process.env.LDAP_BIND_DN!;
  const bindPwd    = process.env.LDAP_BIND_PASSWORD!;

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
