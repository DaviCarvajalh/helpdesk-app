import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  name:  z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const q = new URL(req.url).searchParams.get("q") ?? "";

    const customers = await prisma.hdCustomer.findMany({
      where: {
        deletedAt: null,
        ...(q ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { taxId: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: { _count: { select: { contracts: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role === ROLES.USUARIO) throw new ForbiddenError("Sin permisos");

    const body = await req.json();
    const data = createSchema.parse(body);

    if (data.taxId) {
      const existing = await prisma.hdCustomer.findFirst({ where: { taxId: data.taxId, deletedAt: null } });
      if (existing) return NextResponse.json({ message: "RUT/Tax ID ya existe" }, { status: 409 });
    }

    const customer = await prisma.hdCustomer.create({
      data: {
        name:  data.name,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
