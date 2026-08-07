# TODO — HelpDesk Enterprise

Última actualización: 2026-06-25

---

## 🔴 BLOQUEANTE

- [ ] **[ADR-003] Corregir schema DB** — Renombrar tablas con prefijos de dominio, agregar campos de auditoría, crear tabla `aud_log` y `cfg_sla`. Requiere aprobación.
- [ ] **Bug: `assigneeId`** — Dashboard query usa `assigneeId: null` pero el campo en Prisma es `assignedTo`. Corregir luego del schema rename.

---

## 🔴 Alta prioridad

- [x] Ticket detalle `/tickets/[id]` — metadata, descripción, SLA timer
- [x] Comentarios de ticket — internos y externos (con control de propiedad)
- [x] Historial de cambios automático (en API PATCH)
- [x] RBAC en API routes — verificar rol además de autenticación
- [x] Asignación de técnico a ticket

---

## 🟡 Media prioridad

- [ ] Módulo SLA — `cfg_sla`, cálculo automático, indicador visual
- [ ] Inventario CRUD — `inv_asset` con paginación y filtros
- [ ] Credenciales CRUD — con cifrado AES-256-GCM
- [ ] Audit log `aud_log` — registrar operaciones importantes
- [ ] Contratos CRUD — `hd_contract` con alertas de vencimiento
- [ ] Base de Conocimiento CRUD — con búsqueda

---

## 🟢 Baja prioridad

- [ ] Reportes — gráficas y exportación CSV
- [ ] Configuración — gestión de usuarios, roles, estados
- [ ] Refresh token / sesión extendida
- [x] Health check endpoint `/api/health`
- [ ] Tests unitarios de API routes
