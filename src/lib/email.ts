// Email helper usando Resend (RESEND_API_KEY en .env)
// Si la key no está configurada, las funciones fallan silenciosamente.

const FROM = process.env.EMAIL_FROM ?? "helpdesk@ignisterra.com";
const BASE = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // no configurado → ignorar
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch (err) {
    console.error("[EMAIL]", err);
  }
}

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#374151;max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#059669;padding:16px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:18px">HelpDesk</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="color:#111827;margin-top:0">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0">Este es un mensaje automático del sistema de tickets.</p>
    </div>
  </body></html>`;
}

/* ── Ticket creado → al solicitante ── */
export async function sendTicketCreated(opts: {
  to: string; name: string;
  ticketNumber: string; ticketId: string; title: string; priority: string;
}) {
  const url  = `${BASE}/tickets/${opts.ticketId}`;
  const body = `
    <p>Hola <strong>${opts.name}</strong>,</p>
    <p>Tu ticket ha sido creado exitosamente.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 0;color:#6b7280">N° Ticket</td><td><strong>${opts.ticketNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Título</td><td>${opts.title}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Prioridad</td><td>${opts.priority}</td></tr>
    </table>
    <a href="${url}" style="display:inline-block;margin-top:16px;background:#059669;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Ver ticket</a>`;
  await send(opts.to, `[${opts.ticketNumber}] Ticket creado: ${opts.title}`, wrap("Ticket creado", body));
}

/* ── Ticket asignado → al técnico ── */
export async function sendTicketAssigned(opts: {
  to: string; techName: string;
  ticketNumber: string; ticketId: string; title: string; requester: string;
}) {
  const url  = `${BASE}/tickets/${opts.ticketId}`;
  const body = `
    <p>Hola <strong>${opts.techName}</strong>,</p>
    <p>Se te ha asignado el siguiente ticket:</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 0;color:#6b7280">N° Ticket</td><td><strong>${opts.ticketNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Título</td><td>${opts.title}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Solicitante</td><td>${opts.requester}</td></tr>
    </table>
    <a href="${url}" style="display:inline-block;margin-top:16px;background:#059669;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Abrir ticket</a>`;
  await send(opts.to, `[${opts.ticketNumber}] Ticket asignado: ${opts.title}`, wrap("Ticket asignado", body));
}

/* ── Ticket cerrado → al solicitante ── */
export async function sendTicketClosed(opts: {
  to: string; name: string;
  ticketNumber: string; ticketId: string; title: string;
}) {
  const url  = `${BASE}/tickets/${opts.ticketId}`;
  const body = `
    <p>Hola <strong>${opts.name}</strong>,</p>
    <p>Tu ticket <strong>${opts.ticketNumber}</strong> ha sido <strong>cerrado</strong>.</p>
    <p>${opts.title}</p>
    <a href="${url}" style="display:inline-block;margin-top:16px;background:#6b7280;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Ver detalle</a>`;
  await send(opts.to, `[${opts.ticketNumber}] Ticket cerrado: ${opts.title}`, wrap("Ticket cerrado", body));
}
