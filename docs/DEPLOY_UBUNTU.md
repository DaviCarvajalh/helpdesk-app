# Guía de Deploy — Ubuntu Server

## Requisitos
- Ubuntu 22.04 LTS
- Dominio apuntando al servidor (para SSL)
- Acceso root o usuario con sudo

---

## 1. Instalar Node.js 20

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # debe mostrar v20.x.x
```

---

## 2. Instalar PostgreSQL 17

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Crear base de datos y usuario
sudo -u postgres psql <<EOF
CREATE USER helpdesk WITH PASSWORD 'CAMBIA_ESTA_CONTRASEÑA';
CREATE DATABASE helpdesk OWNER helpdesk;
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;
EOF

# Verificar
sudo -u postgres psql -c "\l"
```

---

## 3. Instalar PM2

```bash
npm install -g pm2
pm2 startup  # seguir las instrucciones que imprime
```

---

## 4. Clonar y configurar la aplicación

```bash
cd /var/www
git clone https://github.com/DaviCarvajalh/helpdesk-app.git helpdesk
cd helpdesk

# Instalar dependencias
npm install

# Copiar y editar variables de entorno
cp .env.example .env
nano .env
# → Editar DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, APP_URL, etc.
```

### Generar valores seguros

```bash
# JWT_SECRET (48+ bytes)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# ENCRYPTION_KEY (exactamente 32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 5. Migrar DB y hacer seed inicial

```bash
# Aplicar migraciones
npx prisma migrate deploy

# Crear datos iniciales (roles, estados, prioridades, admin)
npm run db:seed
```

> ⚠️ **Importante:** El seed crea `admin@helpdesk.cl` / `Admin1234!`  
> **Cambia la contraseña inmediatamente** desde Configuración → Usuarios

---

## 6. Build y arrancar con PM2

```bash
npm run build

pm2 start npm --name "helpdesk" -- start
pm2 save

# Verificar que está corriendo
pm2 status
pm2 logs helpdesk
```

La app corre en `http://localhost:3000`

---

## 7. Instalar Nginx

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/helpdesk
```

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Adjuntos subidos
    location /uploads {
        alias /var/www/helpdesk/public/uploads;
        expires 7d;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática (ya incluida, verificar)
sudo certbot renew --dry-run
```

---

## 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 10. Flujo de actualización (deploys futuros)

```bash
cd /var/www/helpdesk
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 restart helpdesk
```

O crear un script `/var/www/helpdesk/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /var/www/helpdesk
git pull
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart helpdesk
echo "✅ Deploy completado"
```

```bash
chmod +x deploy.sh
# Para deployar: ./deploy.sh
```

---

## Checklist final

- [ ] `DATABASE_URL` apunta a PostgreSQL de producción
- [ ] `JWT_SECRET` es un valor aleatorio fuerte (no el de dev)
- [ ] `ENCRYPTION_KEY` tiene exactamente 32 caracteres
- [ ] `APP_URL` tiene la URL real con https
- [ ] `RESEND_API_KEY` configurada (o emails desactivados)
- [ ] Seed ejecutado: `npm run db:seed`
- [ ] Contraseña admin cambiada desde la UI
- [ ] SSL activo (`https://`)
- [ ] PM2 configurado con `pm2 save` y `pm2 startup`
- [ ] UFW activo, solo puertos 22, 80, 443
- [ ] Puerto 5432 (PostgreSQL) **NO** expuesto al exterior
- [ ] Puerto 3000 (Next.js) **NO** expuesto al exterior (solo via Nginx)

---

## Notas de seguridad

- El `.env` nunca debe estar en el repositorio (está en `.gitignore`)
- Los adjuntos se guardan en `/var/www/helpdesk/public/uploads/` — incluir en backups
- Backups de PostgreSQL: `pg_dump helpdesk > backup_$(date +%F).sql`
