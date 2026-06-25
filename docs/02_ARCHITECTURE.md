# ARCHITECTURE — HelpDesk Enterprise

---

## Patrón General

Next.js App Router con separación clara entre:
- **Server Components** → Acceso directo a DB via Prisma, sin exponer datos sensibles al cliente
- **Client Components** → Solo UI interactiva (forms, estado local)
- **API Routes** → REST endpoints validados con Zod, autenticados con JWT

---

## Capas

```
Browser
  ↓ HTTPS
Next.js Middleware (Edge) → jose JWT verify → redirect si no autenticado
  ↓
App Router
  ├── Server Components → prisma (directo)
  ├── Client Components → fetch /api/*
  └── API Routes (Node.js) → Zod validate → Prisma → Response
            ↓
       PostgreSQL 17
```

---

## Auth Flow

```
POST /api/auth/login
  → Zod validate body
  → prisma.user.findUnique
  → bcrypt.compare
  → signToken (jsonwebtoken, 8h)
  → Set-Cookie: hd_token (HttpOnly, SameSite=Lax)
  → 200 { user }

Middleware (Edge)
  → jwtVerify (jose)
  → next() | redirect /login
```

---

## Estructura de módulos target

```
src/
├── app/
│   ├── (auth)/            ← Rutas públicas
│   ├── (dashboard)/       ← Rutas protegidas
│   └── api/
│       ├── auth/
│       ├── tickets/
│       ├── inventory/
│       ├── credentials/
│       ├── contracts/
│       ├── knowledge/
│       └── reports/
├── components/
│   ├── layout/            ← Sidebar, Header
│   ├── ui/                ← Botones, inputs, modales reutilizables
│   └── tickets/           ← Componentes específicos del dominio
├── lib/
│   ├── prisma.ts          ← Singleton PrismaClient
│   ├── jwt.ts             ← sign/verify (jsonwebtoken)
│   └── auth.ts            ← getSession, requireSession
└── middleware.ts           ← Edge auth guard
```

---

## Decisiones de arquitectura clave

| Decisión | Elección | Razón |
|---|---|---|
| Auth storage | HttpOnly cookie | Inmune a XSS (vs localStorage) |
| Edge vs Node middleware | Jose (Edge) | Middleware Next.js solo corre en Edge Runtime |
| ORM | Prisma 5 | Prisma 7 tiene breaking changes incompatibles con Next.js 14 |
| Token refresh | Sin refresh token (8h) | Simplicidad — ampliar si se requiere sesión larga |
