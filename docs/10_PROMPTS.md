# PROMPTS REUTILIZABLES — HelpDesk Enterprise

---

## Inicio de sesión

```
Lee docs/00_AI_CONSTITUTION.md y docs/01_PROJECT_CONTEXT.md.
Luego continúa con: [tarea]
```

---

## Nueva funcionalidad

```
Quiero implementar: [descripción]
Sigue el flujo: Analizar → Detectar riesgos → Diseñar → Aprobar → Implementar → Validar → Documentar
No escribas código hasta que yo apruebe el diseño.
```

---

## Revisión de seguridad

```
Revisa [archivo/módulo] contra OWASP Top 10.
Reporta: Vulnerabilidad | Riesgo | Severidad | Mitigación
```

---

## Nueva API route

```
Crea la API route para [recurso] con:
- Método: GET/POST/PUT/DELETE
- Auth: requireSession()
- Validación: Zod schema
- RBAC: roles permitidos = [roles]
- Paginación: sí/no
Sigue el patrón en docs/04_DEVELOPMENT_STANDARD.md
```

---

## Nuevo modelo Prisma

```
Agrega el modelo [nombre] al schema siguiendo docs/03_DATABASE_STANDARD.md:
- Dominio: [sec/hd/inv/cfg/kb/aud]
- Campos requeridos: [lista]
- Relaciones: [lista]
- Incluir campos de auditoría: created_by, updated_by, deleted_at
```

---

## Fix de bug

```
Bug: [descripción]
Archivo: [ruta]
Comportamiento esperado: [descripción]
Comportamiento actual: [descripción]
Analiza la causa raíz antes de proponer solución.
```
