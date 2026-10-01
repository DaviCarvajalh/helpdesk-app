This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Producción con Docker

Despliegue reproducible en servidor limpio (Ubuntu Server + Docker + Docker Compose):

```bash
git clone <repo-url> helpdesk-app
cd helpdesk-app
cp .env.example .env
nano .env   # completar POSTGRES_PASSWORD, JWT_SECRET, ENCRYPTION_KEY, APP_URL (ver comentarios en el archivo)

docker compose build
docker compose up -d
```

Con esto la aplicación queda funcionando en `http://<APP_URL>` (o `http://172.20.2.133:3000` según `compose.yaml`).
**Las migraciones de Prisma se aplican automáticamente** mediante el servicio `migrate`
(`compose.yaml`), que corre `prisma migrate deploy` usando el stage `builder` (instalación
completa de Node, sin podar) y se ejecuta hasta completarse **antes** de que `app` arranque
(`depends_on: migrate: condition: service_completed_successfully`). Es idempotente: si ya
están aplicadas, termina sin cambios. No es necesario ejecutarlo manualmente ni copiar el
CLI de Prisma dentro de la imagen runtime de la app (por diseño — ver comentarios en `Dockerfile`).

**Seed inicial (opcional, solo primera vez)** — crea roles, prioridades, estados y el usuario administrador.
Se ejecuta con un servicio dedicado (usa el stage `builder`, que incluye `ts-node`; el contenedor `app` en producción no lo necesita):
```bash
docker compose --profile tools run --rm seed
```
Credenciales por defecto si no defines `ADMIN_EMAIL`/`ADMIN_PASSWORD` en `.env`: `admin@helpdesk.cl` / `Admin1234!` — **cámbiala inmediatamente**.
El seed usa `upsert`, por lo que ejecutarlo más de una vez es seguro (no duplica datos).

**Comandos**
```bash
docker compose build                        # construir imágenes
docker compose up -d                         # iniciar (corre `migrate` y luego `app`)
docker compose ps                            # verificar estado
docker compose logs -f app                   # logs de la app
docker compose logs migrate                  # logs de la última migración
docker compose --profile tools run --rm seed # seed inicial (una sola vez)
docker compose down                          # detener
```

**Actualizar versión**
```bash
git pull
docker compose build
docker compose up -d   # recrea el contenedor y aplica migraciones nuevas automáticamente
```

**Backup / Restore (Postgres)**
```bash
# Backup
docker compose exec db pg_dump -U helpdesk helpdesk > backup_$(date +%F).sql

# Restore
cat backup_YYYY-MM-DD.sql | docker compose exec -T db psql -U helpdesk -d helpdesk
```

App accesible en `http://172.20.2.133:3000` (temporal, hasta configurar reverse proxy + DNS `helpdesk.ignisterra.cl`).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
