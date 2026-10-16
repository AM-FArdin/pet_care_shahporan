// Edge and Node compatible session token utilities using Web Crypto API

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "shahporan2026";
const DEFAULT_SECRET = "shahporan-vet-admin-secure-auth-secret-key-2026";

export const COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD,
  };
}

export function validateCredentials(inputUsername?: string, inputPassword?: string): boolean {
  const { username, password } = getAdminCredentials();
  if (!inputPassword) return false;
  
  // If username is provided, verify both; if only password is provided, verify password
  const usernameMatches = !inputUsername || inputUsername.trim().toLowerCase() === username.toLowerCase();
  const passwordMatches = inputPassword === password;
  
  return usernameMatches && passwordMatches;
}

// Helper: base64url encoding/decoding without external dependencies
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SessionPayload {
  username: string;
  role: "admin";
  exp: number; // unix timestamp in seconds
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
  const key = await getCryptoKey(secret);
  
  const payload: SessionPayload = {
    username,
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = new TextEncoder().encode(payloadEncoded);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataToSign);
  const signatureEncoded = arrayBufferToBase64Url(signatureBuffer);

  return `${payloadEncoded}.${signatureEncoded}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadEncoded, signatureEncoded] = parts;
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
    const key = await getCryptoKey(secret);

    // Decode signature
    let base64Sig = signatureEncoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) {
      base64Sig += "=";
    }
    const sigBinary = atob(base64Sig);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const dataToVerify = new TextEncoder().encode(payloadEncoded);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataToVerify);
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
