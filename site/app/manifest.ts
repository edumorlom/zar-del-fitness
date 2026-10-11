import type { MetadataRoute } from "next";
import { business } from "@/lib/content";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${business.name} · Reto de los 25 días`,
    short_name: business.name,
    description: "Entrenamiento personal online y presencial con Ronald Medina, el Zar del Fitness.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
