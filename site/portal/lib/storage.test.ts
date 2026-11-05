import assert from "node:assert/strict";
import { test } from "node:test";
import { FILE_KEY, imageType, signedUrl } from "./storage.ts";

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

test("la foto subida es JPG o PNG por su contenido, no por el nombre", () => {
  assert.equal(imageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "jpg");
  assert.equal(imageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d])), "png");
  assert.equal(imageType(new TextEncoder().encode("<html>")), null);
  assert.equal(imageType(new Uint8Array([])), null);
});

test("sólo se piden fotos, certificados y fotos de progreso de un cliente", () => {
  assert.match("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/certificado.png", FILE_KEY);
  assert.match("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/foto.jpg", FILE_KEY);
  assert.match("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/progreso/0b6f4c1e-2d3a-4f5b-9c8d-7e6f5a4b3c2d.jpg", FILE_KEY);
  assert.doesNotMatch("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/progreso/../foto.jpg", FILE_KEY);
  assert.doesNotMatch("alumnos/acfe1a85-7a44-4609-97c8-34725ac361ad/progreso/otra/foto.jpg", FILE_KEY);
  assert.doesNotMatch("alumnos/../secreto/foto.jpg", FILE_KEY);
  assert.doesNotMatch("otros/acfe1a85-7a44-4609-97c8-34725ac361ad/foto.jpg", FILE_KEY);
});
