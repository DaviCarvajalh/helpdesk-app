import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). Configúralo en las variables de entorno."
  );
}

const JWT_SECRET: string = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn ?? JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
