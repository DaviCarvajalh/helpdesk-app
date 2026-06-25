# DATABASE STANDARD — HelpDesk Enterprise

---

## Reglas Generales

- Idioma: **inglés**
- Formato: **snake_case**
- Tablas: **singular**
- PK siempre: `id` (cuid)

---

## Dominios

| Prefijo | Dominio |
|---|---|
| `sec_` | Seguridad (usuarios, roles, credenciales) |
| `hd_` | Mesa de Ayuda (tickets, clientes, contratos) |
| `inv_` | Inventario TI |
| `cfg_` | Configuración (prioridades, estados, categorías) |
| `kb_` | Base de Conocimiento |
| `aud_` | Auditoría |

---

## Tablas del schema actual → target

| Actual (incorrecto) | Target (correcto) |
|---|---|
| `roles` | `sec_role` |
| `users` | `sec_user` |
| `tickets` | `hd_ticket` |
| `ticket_comments` | `hd_ticket_comment` |
| `ticket_history` | `hd_ticket_history` |
| `categories` | `cfg_category` |
| `priorities` | `cfg_priority` |
| `statuses` | `cfg_status` |
| `inventory_assets` | `inv_asset` |
| `infrastructure_assets` | `inv_infra_asset` |
| `credentials` | `sec_credential` |
| `credential_access_log` | `sec_credential_access` |
| `customers` | `hd_customer` |
| `contracts` | `hd_contract` |
| `knowledge_categories` | `kb_category` |
| `knowledge_articles` | `kb_article` |
| *(faltante)* | `aud_log` |
| *(faltante)* | `cfg_sla` |

---

## Campos estándar por tabla

```sql
id           TEXT PRIMARY KEY   -- cuid()
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at   TIMESTAMPTZ NOT NULL
deleted_at   TIMESTAMPTZ        -- soft delete
created_by   TEXT               -- FK sec_user.id
updated_by   TEXT               -- FK sec_user.id
deleted_by   TEXT               -- FK sec_user.id
```

> **Nota:** Tablas de catálogo simples (cfg_*) no requieren deleted_at/created_by.

---

## Convención de índices

```sql
idx_{tabla}_{campo}          -- índice regular
uk_{tabla}_{campo}           -- unique
fk_{tabla}_{tabla_ref}       -- foreign key
chk_{tabla}_{regla}          -- check constraint
```

---

## Ejemplos

```sql
CREATE INDEX idx_hd_ticket_status_id ON hd_ticket(status_id);
CREATE UNIQUE INDEX uk_sec_user_email ON sec_user(email);
ALTER TABLE hd_ticket ADD CONSTRAINT fk_hd_ticket_sec_user FOREIGN KEY (requester_id) REFERENCES sec_user(id);
```
