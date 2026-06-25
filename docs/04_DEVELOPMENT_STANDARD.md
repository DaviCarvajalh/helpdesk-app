# DEVELOPMENT STANDARD — HelpDesk Enterprise

---

## TypeScript

- `strict: true` siempre
- Sin `any` — usar tipos explícitos o `unknown`
- Interfaces para contratos externos, types para uniones/internos
- Exportar tipos desde `types/` cuando son compartidos

---

## Nomenclatura de código

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase | `TicketCard` |
| Función/variable | camelCase | `getTicketById` |
| Constante global | UPPER_SNAKE | `MAX_RETRIES` |
| Archivo componente | PascalCase | `TicketCard.tsx` |
| Archivo util/lib | camelCase | `formatDate.ts` |
| Directorio | kebab-case | `ticket-detail/` |

---

## API Routes

```typescript
// Patrón estándar para toda API route
export async function METHOD(req: NextRequest) {
  try {
    // 1. Validar sesión
    const session = await requireSession();

    // 2. Validar body con Zod
    const body = schema.parse(await req.json());

    // 3. Lógica de negocio
    const result = await prisma...

    // 4. Respuesta
    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ message: "Datos inválidos", errors: error.issues }, { status: 400 });
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    console.error("[ROUTE_NAME]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
```

---

## Validación con Zod

- Siempre validar entrada en API routes
- Schemas de Zod en `src/lib/schemas/` reutilizables
- `.strict()` en schemas para rechazar campos extra

---

## Manejo de errores

- No exponer stack traces al cliente
- Loggear en servidor con contexto: `console.error("[MODULO][OPERACION]", error)`
- Errores de Prisma: capturar `PrismaClientKnownRequestError` para mensajes específicos

---

## Paginación (estándar)

```typescript
// Query params: ?page=1&limit=20
const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
const skip = (page - 1) * limit;
```

---

## Evitar N+1

```typescript
// ❌ MAL
const tickets = await prisma.ticket.findMany();
for (const t of tickets) {
  const user = await prisma.user.findUnique({ where: { id: t.requesterId } });
}

// ✅ BIEN
const tickets = await prisma.ticket.findMany({
  include: { requester: true }
});
```
