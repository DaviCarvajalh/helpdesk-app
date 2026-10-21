import { NextRequest, NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { requireSession, UnauthorizedError } from "@/lib/auth";
import { attachmentUrl, findAccessibleTicket, isSafeFilename, ticketUploadDir } from "@/lib/attachments";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const dir = ticketUploadDir(params.id);
    const ticket = dir ? await findAccessibleTicket(session, params.id) : null;
    if (!dir || !ticket) return NextResponse.json({ urls: [] });

    let files: string[] = [];
    try {
      const entries = await readdir(dir);
      files = entries.filter(isSafeFilename).map((f) => attachmentUrl(params.id, f));
    } catch {
      // directorio no existe = sin adjuntos
    }

    return NextResponse.json({ urls: files });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ message: error.message }, { status: 401 });
    return NextResponse.json({ urls: [] });
  }
}
