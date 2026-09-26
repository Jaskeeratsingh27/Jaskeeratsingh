function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function sha256Hex(payload: ArrayBuffer): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", payload));
}

export async function verifyHmac(
  payload: ArrayBuffer,
  secret: string,
  header: string | null,
  allowedAlgorithms: readonly string[],
): Promise<boolean> {
  if (!header || !header.includes("=")) return false;
  const [methodRaw, supplied] = header.split("=", 2);
  const method = methodRaw.toLowerCase();
  if (!allowedAlgorithms.includes(method)) return false;

  const hashName =
    method === "sha256"
      ? "SHA-256"
      : method === "sha384"
        ? "SHA-384"
        : method === "sha512"
          ? "SHA-512"
          : null;
  if (!hashName) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: hashName },
    false,
    ["sign"],
  );
  const expected = toHex(await crypto.subtle.sign("HMAC", key, payload));

  if (expected.length !== supplied.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  }
  return diff === 0;
}

async function encryptionKey(secretB64: string): Promise<CryptoKey> {
  const raw = fromBase64(secretB64);
  if (raw.byteLength !== 32) {
    throw new Error("CONTROL_PLANE_SECRET_KEY must decode to exactly 32 bytes");
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(
  plaintext: string,
  keyB64: string,
): Promise<{ ciphertextB64: string; ivB64: string }> {
  const key = await encryptionKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    ciphertextB64: toBase64(new Uint8Array(ciphertext)),
    ivB64: toBase64(iv),
  };
}

export async function decryptSecret(
  ciphertextB64: string,
  ivB64: string,
  keyB64: string,
): Promise<string> {
  const key = await encryptionKey(keyB64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivB64) },
    key,
    fromBase64(ciphertextB64),
  );
  return new TextDecoder().decode(plaintext);
}
