// Los archivos de los clientes (fotos, certificados) en el bucket privado de Railway. No se sirven directo: el portal
// revisa quién pide y lo manda a un enlace firmado que vence en minutos. Firma S3 (SigV4) a mano, sin el SDK de AWS.
import { createHash, createHmac } from "node:crypto";

export type Bucket = { endpoint: string; name: string; accessKeyId: string; secretAccessKey: string; region: string };

export function bucketFromEnv(): Bucket | null {
  const { BUCKET_ENDPOINT, BUCKET_NAME, BUCKET_ACCESS_KEY_ID, BUCKET_SECRET_ACCESS_KEY } = process.env;
  if (!BUCKET_ENDPOINT || !BUCKET_NAME || !BUCKET_ACCESS_KEY_ID || !BUCKET_SECRET_ACCESS_KEY) return null;
  return {
    endpoint: BUCKET_ENDPOINT,
    name: BUCKET_NAME,
    accessKeyId: BUCKET_ACCESS_KEY_ID,
    secretAccessKey: BUCKET_SECRET_ACCESS_KEY,
    region: process.env.BUCKET_REGION || "auto",
  };
}

/**
 * Las claves que puede pedir el portal, por el id del portal anterior del cliente: su foto, su certificado o una de sus
 * fotos de progreso (progreso/<uuid>).
 */
export const FILE_KEY = /^alumnos\/([0-9a-f-]{36})\/(foto|certificado|progreso\/[0-9a-f-]{36})\.(jpg|jpeg|png|pdf)$/;

const encode = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (key: string | Buffer, s: string) => createHmac("sha256", key).update(s).digest();

/** Un enlace firmado (query string, como "aws s3 presign") al objeto `key`, con el bucket en el subdominio. */
export function signedUrl(bucket: Bucket, key: string, now = new Date(), expiresSeconds = 300, method: "GET" | "PUT" | "DELETE" = "GET") {
  const host = `${bucket.name}.${new URL(bucket.endpoint).host}`;
  const amzDate = now.toISOString().replace(/[-:]|\.\d{3}/g, ""); // 20130524T000000Z
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${bucket.region}/s3/aws4_request`;
  const path = "/" + key.split("/").map(encode).join("/");
  const query = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${bucket.accessKeyId}/${scope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ]
    .map(([k, v]) => `${encode(k)}=${encode(v)}`)
    .join("&");
  const request = [method, path, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  let signingKey = hmac(`AWS4${bucket.secretAccessKey}`, date);
  for (const part of [bucket.region, "s3", "aws4_request"]) signingKey = hmac(signingKey, part);
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}

/** Una foto del celular. Con el resto del formulario tiene que entrar en serverActions.bodySizeLimit (next.config.ts). */
export const PHOTO_MAX_MB = 5;

/** JPG o PNG según los primeros bytes (lo que dice el navegador no alcanza); null si es otra cosa. */
export function imageType(bytes: Uint8Array): "jpg" | "png" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if ([0x89, 0x50, 0x4e, 0x47].every((b, i) => bytes[i] === b)) return "png";
  return null;
}

/** Sube un archivo al bucket con un PUT firmado. */
export async function putObject(bucket: Bucket, key: string, body: Uint8Array<ArrayBuffer>, contentType: string) {
  const res = await fetch(signedUrl(bucket, key, new Date(), 300, "PUT"), {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) throw new Error(`Bucket PUT ${key}: ${res.status} ${await res.text()}`);
}

/** Borra un archivo del bucket con un DELETE firmado. */
export async function deleteObject(bucket: Bucket, key: string) {
  const res = await fetch(signedUrl(bucket, key, new Date(), 300, "DELETE"), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`Bucket DELETE ${key}: ${res.status} ${await res.text()}`);
}
