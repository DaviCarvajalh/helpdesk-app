import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import {
  MAX_FILES, MAX_SIZE,
  attachmentUrl, detectImageExt, findAccessibleTicket, ticketUploadDir,
} from "@/lib/attachments";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const dir = ticketUploadDir(params.id);
    const ticket = dir ? await findAccessibleTicket(session, params.id) : null;
    if (!dir || !ticket) return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (!files.length) return NextResponse.json({ message: "No se enviaron archivos" }, { status: 400 });
    if (files.length > MAX_FILES) return NextResponse.json({ message: `Máximo ${MAX_FILES} archivos` }, { status: 400 });

    await mkdir(dir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) continue;

      // El tipo se decide por el contenido real; MIME y nombre del cliente se ignoran
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext    = detectImageExt(buffer);
      if (!ext) continue;

      const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
      await writeFile(path.join(dir, filename), buffer);
      urls.push(attachmentUrl(params.id, filename));
    }

    return NextResponse.json({ urls });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    console.error("[ATTACHMENTS POST]", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
