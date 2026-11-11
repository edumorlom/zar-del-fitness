import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

/** El idioma de lo que ve el cliente; lo cambia app/(portal)/portal/idioma/[lang]. Las páginas del equipo van siempre en castellano. */
export const LANG_COOKIE = "portal_lang";

export const getLang = async (): Promise<Lang> => ((await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "es");
