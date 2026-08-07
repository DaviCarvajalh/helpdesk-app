import { z } from "zod";

/**
 * Política de contraseñas del sistema (validada en servidor):
 * mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.
 */
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial");
