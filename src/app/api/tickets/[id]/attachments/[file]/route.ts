import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { MIME_BY_EXT, findAccessibleTicket, isSafeFilename, ticketUploadDir } from "@/lib/attachments";

type Params = { params: { id: string; file: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    const dir = ticketUploadDir(params.id);
    if (!dir || !isSafeFilename(params.file))
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });

    const ticket = await findAccessibleTicket(session, params.id);
    if (!ticket) return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });

    let data: Buffer;
    try {
      data = await readFile(path.join(dir, params.file));
    } catch {
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });
    }

    const ext = params.file.split(".").pop()!;
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type":           MIME_BY_EXT[ext],
        "Content-Disposition":    `inline; filename="${params.file}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
        "Cache-Control":          "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    console.error("[ATTACHMENT GET]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
