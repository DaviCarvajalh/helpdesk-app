# SECURITY STANDARD — HelpDesk Enterprise

---

## Principio: Secure by Design

Toda funcionalidad se diseña con seguridad desde el inicio, no como capa posterior.

---

## Auth & Session

| Control | Implementación | Estado |
|---|---|---|
| Almacenamiento de sesión | HttpOnly cookie `hd_token` | ✅ |
| Algoritmo JWT | HS256 (HMAC-SHA256) | ✅ |
| Expiración token | 8h (configurable) | ✅ |
| Verificación en Edge | jose (Edge-compatible) | ✅ |
| Refresh token | No implementado | 🟡 Pendiente |
| Logout seguro | Delete cookie en servidor | ✅ |

---

## Password

| Control | Implementación | Estado |
|---|---|---|
| Hash algoritmo | bcrypt | ✅ |
| Salt rounds | 12 | ✅ |
| Complejidad mínima | 8 chars, mayúscula, número, especial | 🟡 Solo validación cliente |
| Sin reversibilidad | Solo hash almacenado | ✅ |

---

## RBAC (Role-Based Access Control)

Roles definidos:
- `Administrador` — Acceso total
- `Supervisor` — Gestión de tickets, reportes, usuarios de su área
- `Técnico` — Gestión de tickets asignados
- `Usuario Final` — Solo sus propios tickets
- `Auditor` — Solo lectura

**Estado actual:** 🔴 Solo verifica autenticación. Sin verificación de rol en API routes.  
**Pendiente:** Middleware de autorización por recurso.

---

## Credenciales almacenadas

- Usar AES-256-GCM para cifrado
- Key derivada de `ENCRYPTION_KEY` env var (32 bytes)
- IV único por registro
- **Nunca** loggear contraseñas descifradas

---

## Variables de entorno requeridas

```env
DATABASE_URL=          # Conexión PostgreSQL
JWT_SECRET=            # Mínimo 32 caracteres aleatorios
ENCRYPTION_KEY=        # Exactamente 32 bytes (hex o base64)
```

---

## OWASP Top 10 — Estado

| Vulnerabilidad | Mitigación | Estado |
|---|---|---|
| A01 Broken Access Control | RBAC + middleware | 🔴 Parcial |
| A02 Cryptographic Failures | bcrypt + AES-256 + HTTPS | 🟡 Parcial |
| A03 Injection | Prisma ORM (parameterized) + Zod | ✅ |
| A04 Insecure Design | Secure by Design | 🟡 En progreso |
| A05 Security Misconfiguration | .env + no debug en prod | ✅ |
| A06 Vulnerable Components | Verificar en cada instalación | 🟡 Manual |
| A07 Auth Failures | JWT + bcrypt + HttpOnly | ✅ |
| A08 Data Integrity | Zod validation | ✅ |
| A09 Logging Failures | Sin audit log centralizado | 🔴 Pendiente |
| A10 SSRF | No fetch externo aún | ✅ N/A |

---

## Reglas de seguridad en código

```typescript
// ❌ NUNCA
console.log("Password:", password);
const secret = "hardcoded-secret";
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SIEMPRE
// Usa process.env.JWT_SECRET
// Usa prisma.user.findUnique({ where: { email } })
// Nunca loggear datos sensibles
```
