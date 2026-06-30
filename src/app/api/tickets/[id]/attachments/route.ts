import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_SIZE  = 5 * 1024 * 1024; // 5 MB
const ALLOWED   = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILES = 5;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();

    const ticket = await prisma.hdTicket.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!ticket) return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });

    const form = await req.formData();
    const files = form.getAll("files") as File[];

    if (!files.length) return NextResponse.json({ message: "No se enviaron archivos" }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ message: `Máximo ${MAX_FILES} archivos` }, { status: 400 });

    const dir = path.join(process.cwd(), "public", "uploads", "tickets", params.id);
    await mkdir(dir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;

      const ext      = file.name.split(".").pop() ?? "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer   = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, filename), buffer);
      urls.push(`/uploads/tickets/${params.id}/${filename}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    console.error("[ATTACHMENTS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
