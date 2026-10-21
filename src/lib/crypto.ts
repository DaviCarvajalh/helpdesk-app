import crypto from "crypto";

// Formato actual: AES-256-GCM (cifrado autenticado). encrypted = "v2:<cipherHex>:<tagHex>".
// Los valores antiguos (AES-256-CBC, sin prefijo) se siguen pudiendo descifrar y se
// convierten a GCM la próxima vez que se guardan.
const V2_PREFIX = "v2:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || Buffer.byteLength(raw, "utf8") < 32) {
    throw new Error(
      "ENCRYPTION_KEY no está definido o es demasiado corto (mínimo 32 caracteres). Configúralo en las variables de entorno."
    );
  }
  // Misma derivación que la versión CBC para poder leer los datos existentes
  return Buffer.from(raw, "utf8").subarray(0, 32);
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: `${V2_PREFIX}${encrypted.toString("hex")}:${tag.toString("hex")}`,
    iv: iv.toString("hex"),
  };
}

export function decrypt(encryptedValue: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, "hex");

  if (encryptedValue.startsWith(V2_PREFIX)) {
    const [cipherHex, tagHex] = encryptedValue.slice(V2_PREFIX.length).split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  }

  // Legacy: AES-256-CBC
  const decipher = crypto.createDecipheriv("aes-256-cbc", getKey(), iv);
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
