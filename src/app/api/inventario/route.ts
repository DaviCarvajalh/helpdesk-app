import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, UnauthorizedError, ForbiddenError, ROLES } from "@/lib/auth";

const createSchema = z.object({
  assetCode:    z.string().min(1).max(50),
  name:         z.string().min(1).max(200),
  brand:        z.string().optional(),
  model:        z.string().optional(),
  serialNumber: z.string().optional(),
  categoryId:   z.string().optional(),
  status:       z.enum(["active", "maintenance", "retired", "storage"]).default("active"),
  location:     z.string().optional(),
  assignedTo:   z.string().nullable().optional(),
  purchaseDate: z.string().optional(),
  warrantyEnd:  z.string().optional(),
  notes:        z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q        = searchParams.get("q")        ?? "";
    const status   = searchParams.get("status")   ?? "";
    const category = searchParams.get("category") ?? "";

    const assets = await prisma.invAsset.findMany({
      where: {
        deletedAt: null,
        ...(q ? {
          OR: [
            { name:      { contains: q, mode: "insensitive" } },
            { assetCode: { contains: q, mode: "insensitive" } },
            { brand:     { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
        ...(status   ? { status }                                    : {}),
        ...(category ? { categoryId: { contains: category, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    // Resolver nombres de los usuarios asignados
    const assigneeIds = Array.from(new Set(assets.map((a) => a.assignedTo).filter(Boolean))) as string[];
    const assignees   = assigneeIds.length
      ? await prisma.secUser.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, name: true, lastname: true },
        })
      : [];
    const assigneeMap = Object.fromEntries(assignees.map((u) => [u.id, u]));

    const result = assets.map((a) => ({
      ...a,
      assignee: a.assignedTo ? assigneeMap[a.assignedTo] ?? null : null,
    }));

    // Stats
    const total       = result.length;
    const active      = result.filter((a) => a.status === "active").length;
    const maintenance = result.filter((a) => a.status === "maintenance").length;
    const retired     = result.filter((a) => a.status === "retired").length;

    return NextResponse.json({ assets: result, stats: { total, active, maintenance, retired } });
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

    // Verificar código único
    const existing = await prisma.invAsset.findFirst({ where: { assetCode: data.assetCode, deletedAt: null } });
    if (existing) return NextResponse.json({ message: "Código de activo ya existe" }, { status: 409 });

    const asset = await prisma.invAsset.create({
      data: {
        assetCode:    data.assetCode,
        name:         data.name,
        brand:        data.brand,
        model:        data.model,
        serialNumber: data.serialNumber,
        categoryId:   data.categoryId,
        status:       data.status,
        location:     data.location,
        assignedTo:   data.assignedTo ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyEnd:  data.warrantyEnd  ? new Date(data.warrantyEnd)  : null,
        notes:        data.notes,
        createdBy:    session.userId,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)    return NextResponse.json({ message: error.message }, { status: 403 });
    if (error instanceof z.ZodError)        return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    console.error("[INVENTARIO POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
