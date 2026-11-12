import assert from "node:assert/strict";
import { test } from "node:test";
import { DIET_IMAGES, renderDietEmail } from "./diet-email.ts";

const empty = { goal: null, breakfast: null, morning_snack: null, lunch: null, afternoon_snack: null, dinner: null, supplements: null };

test("el correo del plan: saludo, objetivo, sólo las comidas cargadas, escapado y con sus saltos de línea", () => {
  const html = renderDietEmail({ name: "JUAN PÉREZ", diet: { ...empty, goal: "Bajar <grasa>", lunch: "Pollo\nEnsalada", dinner: "Merluza" } });
  assert.match(html, /Hola, Juan\./);
  assert.match(html, /Tu objetivo/);
  assert.match(html, /Bajar &#60;grasa&#62;/);
  assert.match(html, /Almuerzo/);
  assert.match(html, /Pollo<br>Ensalada/);
  assert.match(html, /Cena/);
  assert.doesNotMatch(html, /Desayuno|Suplementos/);
  assert.match(html, /href="https:\/\/zardelfitness\.com\.ar\/portal\/mi-progreso#alimentacion"/);
  assert.match(html, /src="cid:hero"/);
  assert.match(html, /src="cid:boton"/);
  assert.deepEqual(DIET_IMAGES.map((i) => i.path), ["https://zardelfitness.com.ar/correo/dieta-hero.jpg", "https://zardelfitness.com.ar/correo/dieta-boton.png"]);
});

test("sin objetivo, no va el recuadro del objetivo", () => {
  assert.doesNotMatch(renderDietEmail({ name: "Ana", diet: { ...empty, breakfast: "Avena" } }), /Tu objetivo/);
});
