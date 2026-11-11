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

/** Lo opcional de una evaluación, en el orden del detalle: perímetros (cm) y lo que da la balanza. */
export const MEASURES = [
  { key: "chest_cm", label: "Pecho", unit: "cm", group: "Perímetros", min: 40, max: 200, int: false },
  { key: "bust_cm", label: "Busto", unit: "cm", group: "Perímetros", min: 40, max: 200, int: false },
  { key: "waist_cm", label: "Cintura", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "abdomen_cm", label: "Abdomen", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "hip_cm", label: "Cadera", unit: "cm", group: "Perímetros", min: 40, max: 220, int: false },
  { key: "biceps_r_cm", label: "Bíceps derecho", unit: "cm", group: "Perímetros", min: 10, max: 80, int: false },
  { key: "biceps_l_cm", label: "Bíceps izquierdo", unit: "cm", group: "Perímetros", min: 10, max: 80, int: false },
  { key: "leg_r_cm", label: "Pierna derecha", unit: "cm", group: "Perímetros", min: 20, max: 120, int: false },
  { key: "leg_l_cm", label: "Pierna izquierda", unit: "cm", group: "Perímetros", min: 20, max: 120, int: false },
  { key: "biological_age", label: "Edad biológica", unit: "años", group: "Balanza", min: 5, max: 120, int: true },
  { key: "visceral_fat", label: "Grasa visceral", unit: "", group: "Balanza", min: 1, max: 60, int: false },
  { key: "bmr_kcal", label: "Metabolismo basal", unit: "kcal", group: "Balanza", min: 500, max: 6000, int: true },
] as const;
// El plan de alimentación, en el orden del día. Los nombres salen del portal anterior (sumar-to-sqlite.mjs).
export const MEALS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "morning_snack", label: "Colación de la mañana" },
  { key: "lunch", label: "Almuerzo" },
  { key: "afternoon_snack", label: "Colación de la tarde" },
  { key: "dinner", label: "Cena" },
  { key: "supplements", label: "Suplementos" },
] as const;
export type MeasureKey =(typeof MEASURES)[number]["key"];
