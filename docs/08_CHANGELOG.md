# CHANGELOG — HelpDesk Enterprise

---

## [0.2.0] — 2026-06-25

### Agregado
- Dashboard con stats en tiempo real desde PostgreSQL
- Sidebar muestra nombre y rol del usuario autenticado (desde JWT)
- Panel "Tickets Recientes" con estado y prioridad
- Panel "Carga por Técnico" con barra de progreso
- Estructura `/docs` con documentación de gobernanza completa

### Corregido
- Middleware reemplazado de `jsonwebtoken` a `jose` (compatibilidad Edge Runtime)
- Layout dashboard ahora pasa datos de sesión reales al Sidebar

---

## [0.1.0] — 2026-06-24

### Agregado
- Proyecto Next.js 14.2.35 + React 18 + TailwindCSS 3.4
- Prisma 5 + PostgreSQL 17
- Schema inicial con modelos: Role, User, Ticket, TicketComment, TicketHistory, Priority, Status, Category, InventoryAsset, InfrastructureAsset, Credential, Customer, Contract, KnowledgeArticle
- Auth: Login con JWT HttpOnly, Logout, Middleware de protección
- Migración inicial `20260624204246_init`
- Seed: 5 roles, 4 prioridades, 7 estados, 8 categorías, admin user, 6 clientes
- Páginas: Login, Dashboard, Tickets (lista + nuevo)
- Stubs: Inventario, Credenciales, Contratos, Conocimiento, Procedimientos, Reportes, Configuración
- Sidebar y Header de layout

### Issues conocidos
- Schema DB no sigue nomenclatura de AI Constitution (ver ADR-003)
