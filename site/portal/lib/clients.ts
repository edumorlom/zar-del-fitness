// Lo que se elige de una lista en la ficha del cliente, y las reglas del seguimiento. Sin base ni servidor: lo usan las
// páginas, los formularios y los tests.

/** Los planes (los mismos que el sitio: db/planes.json "premium" y "general", más el online). */
export const PLANS = [
  { id: "Premium", label: "Premium", text: "Seguimiento uno a uno con el Zar." },
  { id: "General Dirigido", label: "General Dirigido", text: "Entrena en el salón con un coach asignado." },
  { id: "Online", label: "Online", text: "Rutina y controles a distancia." },
] as const;

export const CONDITIONS = [
  "Cardiopatia",
  "Hipertenso",
  "Recuperacion oncologica",
  "Fractura/esguince/desgarro menos de un año",
  "Alergico a medicamento",
  "Diabetes",
  "Hiv+",
  "Cirugias clinicas o esteticas",
  "Hipo o hipertiroidismo",
] as const;

export const BODY_TYPES = ["Ectomorfo", "Mesomorfo", "Endomorfo"] as const;

/** Cada cuánto se controla: al día hasta 30 días desde el último control, por vencer hasta 45, después atrasado. */
export const DUE_DAYS = 30;
export const LATE_DAYS = 45;

export type ControlStatus = "al-dia" | "por-vencer" | "atrasado" | "sin-control";

export const STATUS_LABEL: Record<ControlStatus, string> = {
  "al-dia": "Al día",
  "por-vencer": "Por vencer",
  atrasado: "Atrasado",
  "sin-control": "Sin control",
};

/** Días entre dos fechas "AAAA-MM-DD" (b − a). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function controlStatus(last: string | null, today: string): ControlStatus {
  if (!last) return "sin-control";
  const d = daysBetween(last, today);
  return d <= DUE_DAYS ? "al-dia" : d <= LATE_DAYS ? "por-vencer" : "atrasado";
}

/** Edad aproximada: del portal anterior vino la edad, no la fecha de nacimiento (se guarda el año). */
export const age = (birthYear: number | null, today: string) => (birthYear ? Number(today.slice(0, 4)) - birthYear : null);

/** Índice de masa corporal, con un decimal. */
export const bmi = (weightKg: number | null, heightCm: number | null) =>
  weightKg && heightCm ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10 : null;

// ---------- La composición corporal ----------

/** Lo que trae toda evaluación: el peso y el % graso. */
export type Measured = { weight_kg: number; body_fat_pct: number };
export const leanMass = (c: Measured) => c.weight_kg * (1 - c.body_fat_pct / 100);
export const fatMass = (c: Measured) => (c.weight_kg * c.body_fat_pct) / 100;

/**
 * Las cuatro medidas que se siguen (los resultados, la evolución y las tablas): la masa magra y la grasa en kg salen del
 * peso y el % graso, como en el portal anterior. `better`: hacia dónde es mejorar (0: ni para un lado ni para el otro).
 */
export const BODY_STATS = [
  { key: "weight", label: "Peso", en: "Weight", unit: "kg", better: 0, delta: "kg", of: (c: Measured) => c.weight_kg },
  { key: "fatPct", label: "% Graso", en: "Body fat %", unit: "%", better: -1, delta: "puntos", of: (c: Measured) => c.body_fat_pct },
  { key: "lean", label: "Masa magra", en: "Lean mass", unit: "kg", better: 1, delta: "kg", of: leanMass },
  { key: "fatKg", label: "Grasa", en: "Fat", unit: "kg", better: -1, delta: "kg", of: fatMass },
] as const;
export type BodyStat = (typeof BODY_STATS)[number];
export type BodyStatKey = BodyStat["key"];

/** Una evaluación como punto de la evolución: las cuatro medidas, con su fecha. */
export type BodyPoint = { date: string } & Record<BodyStatKey, number>;
export const bodyPoint = (c: Measured & { date: string }): BodyPoint => ({
  date: c.date,
  weight: c.weight_kg,
  fatPct: c.body_fat_pct,
  lean: leanMass(c),
  fatKg: fatMass(c),
});

/** Lo opcional de una evaluación, en el orden del detalle: perímetros (cm) y lo que da la balanza. */
export const MEASURES = [
  { key: "chest_cm", label: "Pecho", en: "Chest", unit: "cm", group: "Perímetros", min: 40, max: 200, int: false },
  { key: "bust_cm", label: "Busto", en: "Bust", unit: "cm", group: "Perímetros", min: 40, max: 200, int: false },
  { key: "waist_cm", label: "Cintura", en: "Waist", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "abdomen_cm", label: "Abdomen", en: "Abdomen", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "hip_cm", label: "Cadera", en: "Hips", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "biceps_r_cm", label: "Bíceps derecho", en: "Right biceps", unit: "cm", group: "Perímetros", min: 10, max: 80, int: false },
  { key: "biceps_l_cm", label: "Bíceps izquierdo", en: "Left biceps", unit: "cm", group: "Perímetros", min: 10, max: 80, int: false },
  { key: "leg_r_cm", label: "Pierna derecha", en: "Right leg", unit: "cm", group: "Perímetros", min: 20, max: 120, int: false },
  { key: "leg_l_cm", label: "Pierna izquierda", en: "Left leg", unit: "cm", group: "Perímetros", min: 20, max: 120, int: false },
  { key: "biological_age", label: "Edad biológica", en: "Biological age", unit: "años", group: "Balanza", min: 5, max: 120, int: true },
  { key: "visceral_fat", label: "Grasa visceral", en: "Visceral fat", unit: "", group: "Balanza", min: 1, max: 60, int: false },
  { key: "bmr_kcal", label: "Metabolismo basal", en: "Basal metabolic rate", unit: "kcal", group: "Balanza", min: 500, max: 6000, int: true },
] as const;
// El plan de alimentación, en el orden del día. Los nombres salen del portal anterior (sumar-to-sqlite.mjs).
export const MEALS = [
  { key: "breakfast", label: "Desayuno", en: "Breakfast" },
  { key: "morning_snack", label: "Colación de la mañana", en: "Morning snack" },
  { key: "lunch", label: "Almuerzo", en: "Lunch" },
  { key: "afternoon_snack", label: "Colación de la tarde", en: "Afternoon snack" },
  { key: "dinner", label: "Cena", en: "Dinner" },
  { key: "supplements", label: "Suplementos", en: "Supplements" },
] as const;
export type MeasureKey = (typeof MEASURES)[number]["key"];
