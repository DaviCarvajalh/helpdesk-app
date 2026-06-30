import { NextRequest, NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession();

    const ticket = await prisma.hdTicket.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!ticket) return NextResponse.json({ urls: [] });

    const dir = path.join(process.cwd(), "public", "uploads", "tickets", params.id);
    let files: string[] = [];
    try {
      const entries = await readdir(dir);
      files = entries.map((f) => `/uploads/tickets/${params.id}/${f}`);
    } catch {
      // directorio no existe = sin adjuntos
    }

    return NextResponse.json({ urls: files });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ urls: [] });
  }
}
