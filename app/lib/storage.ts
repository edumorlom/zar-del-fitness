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

/** Las claves que puede pedir el portal: la foto o el certificado de un cliente, por su id del portal anterior. */
export const FILE_KEY = /^alumnos\/([0-9a-f-]{36})\/(foto|certificado)\.(jpg|jpeg|png|pdf)$/;

const encode = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (key: string | Buffer, s: string) => createHmac("sha256", key).update(s).digest();

/** Un GET firmado (query string, como "aws s3 presign") al objeto `key`, con el bucket en el subdominio. */
export function signedUrl(bucket: Bucket, key: string, now = new Date(), expiresSeconds = 300) {
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
  const request = ["GET", path, query, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(request)].join("\n");
  let signingKey = hmac(`AWS4${bucket.secretAccessKey}`, date);
  for (const part of [bucket.region, "s3", "aws4_request"]) signingKey = hmac(signingKey, part);
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  return `https://${host}${path}?${query}&X-Amz-Signature=${signature}`;
}
