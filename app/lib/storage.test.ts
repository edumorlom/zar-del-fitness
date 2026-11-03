import assert from "node:assert/strict";
import { test } from "node:test";
import { FILE_KEY, signedUrl } from "./storage.ts";

test("el enlace firmado da la firma del ejemplo de AWS (GET test.txt, 24 h)", () => {
  const url = signedUrl(
    {
      endpoint: "https://s3.amazonaws.com",
      name: "examplebucket",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      region: "us-east-1",
    },
    "test.txt",
    new Date("2013-05-24T00:00:00Z"),
    86400
  );
  assert.equal(new URL(url).host, "examplebucket.s3.amazonaws.com");
  assert.equal(new URL(url).searchParams.get("X-Amz-Signature"), "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404");
});

test("sólo se piden fotos y certificados de un cliente", () => {
  assert.match("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/certificado.png", FILE_KEY);
  assert.match("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/foto.jpg", FILE_KEY);
  assert.doesNotMatch("alumnos/../secreto/foto.jpg", FILE_KEY);
  assert.doesNotMatch("otros/acfe1a85-7a44-4609-97c8-34725ac361ad/foto.jpg", FILE_KEY);
});
