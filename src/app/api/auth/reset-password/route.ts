import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const resetToken = await prisma.secPasswordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "El enlace no es válido o ya fue utilizado." },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { message: "Este enlace ya fue utilizado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { message: "El enlace ha expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    if (!resetToken.user.isActive) {
      return NextResponse.json(
        { message: "La cuenta no está activa." },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.secUser.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.secPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
