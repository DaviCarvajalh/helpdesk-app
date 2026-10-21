import path from "path";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/auth";
import type { JwtPayload } from "@/lib/jwt";

// Los adjuntos se guardan FUERA de /public: solo se sirven vía
// /api/tickets/[id]/attachments/[file], que valida sesión y acceso al ticket.
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

export const MAX_SIZE  = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 5;

export const MIME_BY_EXT: Record<string, string> = {
  png:  "image/png",
  jpg:  "image/jpeg",
  webp: "image/webp",
};

const SAFE_ID       = /^[A-Za-z0-9_-]{1,64}$/;
const SAFE_FILENAME = /^[A-Za-z0-9_-]{1,100}\.(png|jpg|webp)$/;

export function isSafeFilename(name: string): boolean {
  return SAFE_FILENAME.test(name);
}

/** Carpeta de adjuntos del ticket; null si el id no es seguro para usar en una ruta. */
export function ticketUploadDir(ticketId: string): string | null {
  if (!SAFE_ID.test(ticketId)) return null;
  return path.join(UPLOADS_DIR, "tickets", ticketId);
}

export function attachmentUrl(ticketId: string, filename: string): string {
  return `/api/tickets/${ticketId}/attachments/${filename}`;
}

/**
 * Detecta el tipo real de imagen por sus bytes iniciales (no confía en el
 * MIME ni en la extensión enviados por el cliente). Devuelve la extensión.
 */
export function detectImageExt(buf: Buffer): "png" | "jpg" | "webp" | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "jpg";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  return null;
}

/** Ticket no eliminado al que la sesión tiene acceso (Usuario Final: solo los propios). */
export function findAccessibleTicket(session: JwtPayload, ticketId: string) {
  return prisma.hdTicket.findFirst({
    where: {
      id: ticketId,
      deletedAt: null,
      ...(session.role === ROLES.USUARIO ?{ requesterId: session.userId } : {}),
    },
    select: { id: true },
  });
}
