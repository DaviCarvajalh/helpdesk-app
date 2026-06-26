import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // Siempre responder igual para no revelar si el email existe
    const genericResponse = NextResponse.json({
      message: "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
    });

    const user = await prisma.secUser.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) return genericResponse;

    // Invalidar tokens previos del mismo usuario
    await prisma.secPasswordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generar token seguro con expiración de 1 hora
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.secPasswordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "HelpDesk <noreply@tudominio.com>",
      to: user.email,
      subject: "Restablecer contraseña — HelpDesk",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#10b981;margin-bottom:8px;">HelpDesk</h2>
          <p style="color:#374151;">Hola <strong>${user.name}</strong>,</p>
          <p style="color:#374151;">Recibimos una solicitud para restablecer tu contraseña.
          Haz clic en el botón para continuar. El enlace expira en <strong>1 hora</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:24px 0;padding:12px 24px;
                    background:#10b981;color:#fff;border-radius:8px;
                    text-decoration:none;font-weight:600;">
            Restablecer contraseña
          </a>
          <p style="color:#6b7280;font-size:13px;">
            Si no solicitaste esto, ignora este mensaje. Tu contraseña no cambiará.
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">
            © ${new Date().getFullYear()} ETL Technology · HelpDesk
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("[FORGOT_PASSWORD] Resend error:", emailError);
    }

    return genericResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Email inválido" }, { status: 400 });
    }
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
