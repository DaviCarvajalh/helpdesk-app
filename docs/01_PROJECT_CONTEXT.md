# PROJECT_CONTEXT — HelpDesk Enterprise

**Última actualización:** 2026-06-25  
**Estado:** 🔴 En construcción — Schema DB pendiente de corrección  

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 14.2.35 |
| UI | React | 18 |
| Estilos | TailwindCSS | 3.4 |
| Lenguaje | TypeScript | 5 |
| ORM | Prisma | 5.22 |
| Base de datos | PostgreSQL | 17.10 |
| Auth | JWT (jsonwebtoken) + jose | — |
| Hash | bcryptjs | — |
| Validación | Zod | — |
| Iconos | lucide-react | — |

---

## Directorio

```
C:\Projects\helpdesk-app\
├── docs/                    ← Documentación (esta carpeta)
├── prisma/
│   ├── schema.prisma        ← 🔴 Pendiente renombrar a nomenclatura correcta
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login/    ← Login page
│   │   ├── (dashboard)/     ← Layout + páginas protegidas
│   │   └── api/auth/, api/tickets/
│   ├── components/layout/   ← Sidebar, Header
│   └── lib/                 ← prisma.ts, jwt.ts, auth.ts
├── .env                     ← DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY
└── middleware.ts             ← Protección de rutas con jose
```

---

## Estado por módulo

| Módulo | Estado | Notas |
|---|---|---|
| Auth (Login/Logout) | ✅ Funcional | JWT HttpOnly cookie |
| Dashboard | ✅ Funcional | Stats reales desde DB |
| Tickets (lista + nuevo) | ✅ UI lista | API GET/POST implementada |
| Ticket detalle/comentarios | 🔴 Pendiente | — |
| Inventario | 🟡 Stub UI | Sin CRUD real |
| Credenciales | 🟡 Stub UI | Sin CRUD real |
| Contratos | 🟡 Stub UI | Sin CRUD real |
| Base de Conocimiento | 🟡 Stub UI | Sin CRUD real |
| SLA | 🔴 Pendiente | No implementado |
| Reportes | 🟡 Stub UI | Sin lógica |
| Configuración | 🟡 Stub UI | Sin lógica |

---

## Credenciales por defecto

- **Email:** admin@helpdesk.cl  
- **Password:** Admin1234!  
- **DB:** postgresql://postgres:postgres@127.0.0.1:5432/helpdesk

---

## Issues críticos pendientes

1. 🔴 **Schema DB**: Nombres sin prefijos de dominio (incumple AI Constitution §7, §12)
2. 🔴 **Schema DB**: Falta `deleted_at`, `created_by`, `updated_by` en modelos principales
3. 🔴 **Bug**: `assigneeId` en query dashboard debería ser `assignedTo`
4. 🟡 **Audit log**: Sin tabla `aud_log` centralizada
5. 🟡 **RBAC**: Solo verifica autenticación, no autorización por rol
6. 🟡 **SLA**: Sin modelo ni lógica implementada
