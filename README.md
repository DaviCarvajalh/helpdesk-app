This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Producción con Docker

**Instalación inicial** (en `/opt/ignisterra/helpdesk`):
```bash
cp .env.example .env
nano .env   # POSTGRES_PASSWORD, JWT_SECRET, ENCRYPTION_KEY, APP_URL
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

> El seed inicial (`npm run db:seed`) requiere `ts-node`, no incluido en la imagen de producción (standalone).
> Ejecútalo una sola vez desde un entorno con Node+deps completas apuntando al `DATABASE_URL` de producción,
> o crea el usuario admin manualmente en la tabla `sec_user`.

**Comandos**
```bash
docker compose build      # construir imágenes
docker compose up -d      # iniciar
docker compose ps         # verificar
docker compose logs -f    # logs (o: docker logs helpdesk-app-1)
docker compose down       # detener
```

**Actualizar versión**
```bash
git pull
docker compose build
docker compose up -d
docker compose exec app npx prisma migrate deploy
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
