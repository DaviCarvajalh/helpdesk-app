"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Error al procesar la solicitud");
        return;
      }

      setSent(true);
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <MessageCircle className="text-white" size={28} strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-gray-800">Help</span>
            <span className="text-emerald-500">Desk</span>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Revisa tu correo
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Si <strong>{email}</strong> está registrado, recibirás un enlace
              para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
            >
              <ArrowLeft size={15} />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-800 text-center mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.cl"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <Send size={14} />
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
