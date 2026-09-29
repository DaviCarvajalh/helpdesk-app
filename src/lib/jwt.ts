import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). Configúralo en las variables de entorno."
    );
  }
  return secret;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn ?? JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
