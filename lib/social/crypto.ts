function base64UrlEncode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

function base64UrlDecode(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function getEncryptionKey() {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error("TOKEN_ENCRYPTION_KEY is not configured.");
  const raw = Buffer.from(encoded, "base64");
  if (raw.byteLength !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plaintext: string) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

export async function decryptSecret(value: string) {
  const [version, encodedIv, encodedCiphertext] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) throw new Error("Unsupported encrypted secret format.");
  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlDecode(encodedIv) }, key, base64UrlDecode(encodedCiphertext));
  return new TextDecoder().decode(plaintext);
}

export function createRandomValue(bytes = 32) {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
