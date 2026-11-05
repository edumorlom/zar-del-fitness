import assert from "node:assert/strict";
import { test } from "node:test";
import { signVisitor } from "./digui.ts";

test("la firma es la misma que verifica Digui (su assistant/test_sql.py)", () => {
  assert.equal(
    signVisitor("s3cret", "rcp-1", { customer_id: "123" }, 1800003600).signature,
    "6c26fc6d87d4059c5c01ec0de54c5ab2433531fb639afb01d182a52106c1232d"
  );
});
