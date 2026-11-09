import assert from "node:assert/strict";
import { test } from "node:test";
import { FORGET_VISITOR, readVisitor, sharedDomain, signedIn, visitorCookie } from "./digui-cookie.ts";

test("sólo desde mi. la cookie es de todo el dominio, para que la vea el sitio", () => {
  assert.equal(sharedDomain("mi.zardelfitness.com.ar"), "; domain=zardelfitness.com.ar");
  for (const host of ["zardelfitness.com.ar", "localhost", "mi.localhost", "x.up.railway.app"]) assert.equal(sharedDomain(host), "", host);
});

test("borrar alcanza a la de este dominio y a la que dejó mi.", () => {
  assert.deepEqual(FORGET_VISITOR, ["digui_visitor=; path=/; max-age=0", "digui_visitor=; path=/; max-age=0; domain=zardelfitness.com.ar"]);
});

test("con sesión sólo si Clerk tiene un __client_uat que no es 0", () => {
  assert.equal(signedIn("a=1; __client_uat=1762530000"), true);
  assert.equal(signedIn("__client_uat_Ab-1x=1762530000; a=1"), true);
  assert.equal(signedIn("__client_uat=0; __client_uat_Ab1=0"), false);
  assert.equal(signedIn("a=1; x__client_uat=17"), false);
  assert.equal(signedIn(""), false);
});

test("lo que guarda visitorCookie se lee igual entre otras cookies", () => {
  const cookie = visitorCookie("42", 1800003600, "ab12", 1800000000);
  assert.equal(cookie, "digui_visitor=42.1800003600.ab12; path=/; max-age=3600; samesite=lax");
  const jar = `__client_uat=1; ${cookie.split(";")[0]}; otra=x`;
  assert.deepEqual(readVisitor(jar), { params: { customer_id: "42" }, exp: 1800003600, signature: "ab12" });
});

test("sin cookie, borrada o con otra forma: null", () => {
  assert.equal(readVisitor("a=1"), null);
  assert.equal(readVisitor(FORGET_VISITOR[0].split(";")[0]), null);
  assert.equal(readVisitor("digui_visitor=42.x.ab12"), null);
  assert.equal(readVisitor("xdigui_visitor=42.1.ab12"), null);
});
