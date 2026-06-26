import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, ForbiddenError, UnauthorizedError, ROLES } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();

    // Auditor y Usuario Final no pueden revelar
    if ([ROLES.USUARIO, ROLES.AUDITOR].includes(session.role as never)) {
      throw new ForbiddenError("Sin permiso para revelar contraseñas");
    }

    const credential = await prisma.secCredential.findFirst({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        encryptedPassword: true,
        encryptionIv: true,
        ownerId: true,
      },
    });

    if (!credential)
      return NextResponse.json({ message: "Credencial no encontrada" }, { status: 404 });

    // Técnico solo puede ver sus propias credenciales
    if (session.role === ROLES.TECNICO && credential.ownerId !== session.userId) {
      throw new ForbiddenError("Solo puedes revelar tus propias credenciales");
    }

    const password = decrypt(credential.encryptedPassword, credential.encryptionIv);

    // Registrar acceso en auditoría
    await prisma.secCredentialAccess.create({
      data: {
        credentialId: credential.id,
        userId: session.userId,
        action: "reveal",
      },
    });

    return NextResponse.json({ password });
  } catch (error) {
    if (error instanceof UnauthorizedError)
      return NextResponse.json({ message: error.message }, { status: 401 });
    if (error instanceof ForbiddenError)
      return NextResponse.json({ message: error.message }, { status: 403 });
    console.error("[CREDENTIAL REVEAL]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
