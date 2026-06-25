# ROADMAP — HelpDesk Enterprise

---

## Fase 0 — Fundación ✅ (completada parcialmente)

- [x] Next.js 14.2 + React 18 + TailwindCSS 3.4
- [x] Prisma 5 + PostgreSQL 17
- [x] Auth JWT HttpOnly + Middleware Edge
- [x] Dashboard con stats reales
- [x] Estructura de directorios
- [ ] **Schema DB con nomenclatura correcta** ← BLOQUEANTE
- [ ] Documentación inicial

---

## Fase 1 — Core Tickets 🔴 (en progreso)

- [ ] Schema corregido + migración limpia + re-seed
- [ ] Ticket detalle: descripción, metadata, SLA timer
- [ ] Comentarios: internos y externos
- [ ] Historial de cambios automático
- [ ] Asignación de técnico
- [ ] Cambio de estado con validación de flujo
- [ ] RBAC en API routes

---

## Fase 2 — SLA & Notificaciones

- [ ] Modelo `cfg_sla` con tiempos por prioridad
- [ ] Cálculo automático de SLA en creación de ticket
- [ ] Indicador visual en lista de tickets (on-time / at-risk / breached)
- [ ] Alerta en dashboard de tickets próximos a vencer

---

## Fase 3 — Inventario TI

- [ ] CRUD `inv_asset` (equipos, software, periféricos)
- [ ] CRUD `inv_infra_asset` (servidores, redes)
- [ ] Asignación de activos a usuarios
- [ ] Historial de movimientos
- [ ] Vinculación activo ↔ ticket

---

## Fase 4 — Credenciales

- [ ] CRUD seguro con AES-256-GCM
- [ ] Visualización con confirmación (reveal & hide)
- [ ] Log de acceso `sec_credential_access`
- [ ] Expiración y alertas

---

## Fase 5 — Base de Conocimiento

- [ ] CRUD artículos con categorías
- [ ] Búsqueda full-text
- [ ] Vinculación artículo ↔ ticket (solución sugerida)
- [ ] Control de publicación

---

## Fase 6 — Contratos & Clientes

- [ ] CRUD `hd_customer` con RUT/RFC
- [ ] CRUD `hd_contract` con vigencia y alertas de vencimiento
- [ ] SLA por contrato/cliente

---

## Fase 7 — Reportes

- [ ] Tickets por período / técnico / prioridad / estado
- [ ] Cumplimiento SLA
- [ ] Tiempo promedio de resolución
- [ ] Exportación CSV/PDF

---

## Fase 8 — Configuración & Admin

- [ ] Gestión de usuarios (CRUD)
- [ ] Gestión de roles
- [ ] Personalización de estados y categorías
- [ ] Gestión de SLA

---

## Fase 9 — Auditoría

- [ ] `aud_log` centralizado: quién hizo qué cuándo
- [ ] Retención configurable
- [ ] Visualización en panel admin
