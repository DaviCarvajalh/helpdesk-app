# ── deps ─────────────────────────────────────────────
FROM node:20.20.2-bookworm-slim AS deps
WORKDIR /app

# openssl: librerías compartidas que Prisma Engine necesita en runtime/build.
# ca-certificates: certificados raíz para conexiones HTTPS de npm/Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ── build ────────────────────────────────────────────
FROM node:20.20.2-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js standalone espera una carpeta public; el proyecto no la commitea.
RUN mkdir -p public

# package.json define build como: prisma generate && next build
RUN npm run build

# ── runtime ──────────────────────────────────────────
FROM node:20.20.2-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root con uid/gid 1001 para compatibilidad con el volumen uploads
# creado por la versión anterior (Alpine usaba nextjs:nodejs 1001:1001).
RUN groupadd -g 1001 nextjs && \
    useradd -u 1001 -g nextjs -s /bin/bash -M nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/@prisma ./node_modules/@prisma

# Adjuntos fuera de /public: se sirven solo vía API con control de acceso
RUN mkdir -p ./uploads && chown -R nextjs:nextjs ./uploads
ENV UPLOADS_DIR=/app/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(4000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
