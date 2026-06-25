# DECISIONS (ADR) — HelpDesk Enterprise

---

## ADR-001 — Downgrade Prisma 7 → Prisma 5

**Fecha:** 2026-06-24  
**Problema:** Prisma 7 cambió el formato de configuración (`prisma.config.ts`) de manera incompatible con el flujo estándar de Next.js 14. El cliente generado requería imports desde `src/generated/prisma` en lugar de `@prisma/client`, bloqueando la integración.  
**Alternativas:** (1) Migrar a Prisma 7 completamente, (2) Mantener Prisma 5, (3) Cambiar ORM a Drizzle.  
**Decisión:** Prisma 5.22.  
**Justificación:** Prisma 5 es la versión LTS estable, ampliamente documentada, sin breaking changes. Prisma 7 no aporta beneficios que justifiquen la complejidad adicional en esta etapa.  
**Impacto:** Bajo. Sin pérdida funcional.

---

## ADR-002 — jose para validación JWT en Middleware

**Fecha:** 2026-06-24  
**Problema:** `jsonwebtoken` usa APIs de Node.js (crypto) que no están disponibles en el Edge Runtime de Next.js donde corre el middleware.  
**Alternativas:** (1) jose, (2) Mover auth a Node.js API route, (3) next-auth.  
**Decisión:** `jose` solo en middleware. `jsonwebtoken` en API routes (Node.js).  
**Justificación:** jose es Edge-compatible, mantenido activamente, sin dependencias. Separar las responsabilidades mantiene el middleware ligero.  
**Impacto:** Bajo. Ambas librerías usan el mismo JWT_SECRET.

---

## ADR-003 — Schema DB pendiente de corrección ⚠️

**Fecha:** 2026-06-25  
**Problema:** El schema inicial se creó sin prefijos de dominio (`sec_`, `hd_`, `cfg_`, etc.), sin campos de auditoría (`created_by`, `updated_by`, `deleted_at`) y con nombres que no siguen el estándar de la AI Constitution.  
**Estado:** PENDIENTE DE APROBACIÓN  
**Propuesta:** Eliminar DB `helpdesk`, rediseñar schema completo con nomenclatura correcta, aplicar migración limpia y re-ejecutar seed.  
**Impacto:** Alto en código (requiere actualizar todas las queries), bajo en datos (entorno de desarrollo sin datos de producción).  
**Requiere aprobación:** Sí.
