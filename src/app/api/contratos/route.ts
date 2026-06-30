import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  customerId:     z.string().min(1),
  contractNumber: z.string().min(1).max(50),
  startDate:      z.string(),
  endDate:        z.string(),
  amount:         z.number().positive().optional(),
  status:         z.enum(["active", "expired", "cancelled", "draft"]).default("active"),
  notes:          z.string().optional(),
});

function contractStatus(contract: { status: string; endDate: Date }): string {
  if (contract.status === "cancelled") return "cancelled";
  const now  = new Date();
  const end  = new Date(contract.endDate);
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (end < now)    return "expired";
  if (days <= 30)   return "expiring";
  return "active";
}

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q      = searchParams.get("q")      ?? "";
    const status = searchParams.get("status") ?? "";

    const contracts = await prisma.hdContract.findMany({
      where: {
        deletedAt: null,
        ...(status === "expiring"
          ? {
              status: { not: "cancelled" },
              endDate: {
                gt: new Date(),
                lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            }
          : status === "expired"
          ? { endDate: { lt: new Date() }, status: { not: "cancelled" } }
          : status
          ? { status }
          : {}),
        ...(q ? {
          OR: [
            { contractNumber: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ],
        } : {}),
      },
      include: { customer: true },
      orderBy: { endDate: "asc" },
    });

    const now     = new Date();
    const in30    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const total    = contracts.length;
    const active   = contracts.filter((c) => c.status !== "cancelled" && new Date(c.endDate) > in30).length;
    const expiring = contracts.filter((c) => c.status !== "cancelled" && new Date(c.endDate) > now && new Date(c.endDate) <= in30).length;
    const expired  = contracts.filter((c) => c.status !== "cancelled" && new Date(c.endDate) < now).length;

    return NextResponse.json({
      contracts: contracts.map((c) => ({ ...c, derivedStatus: contractStatus(c) })),
      stats: { total, active, expiring, expired },
    });
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

    const existing = await prisma.hdContract.findFirst({ where: { contractNumber: data.contractNumber } });
    if (existing) return NextResponse.json({ message: "Número de contrato ya existe" }, { status: 409 });

    const contract = await prisma.hdContract.create({
      data: {
        customerId:     data.customerId,
        contractNumber: data.contractNumber,
        startDate:      new Date(data.startDate),
        endDate:        new Date(data.endDate),
        amount:         data.amount ?? null,
        status:         data.status,
        notes:          data.notes,
        createdBy:      session.userId,
      },
      include: { customer: true },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[CONTRATOS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
