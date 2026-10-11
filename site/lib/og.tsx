// Las imágenes para compartir (WhatsApp, Instagram, Facebook, X, Google Discover): una por página, generadas
// en el build con las tipografías del sitio. Cada página tiene su opengraph-image.tsx que llama a ogImage().
// Salen en JPEG porque WhatsApp no muestra la vista previa si la imagen pesa más de ~300 KB (en PNG, con la
// foto, pesan casi 1 MB). Se exportan sin extensión (out/…/opengraph-image): el .htaccess las sirve como JPEG.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { formatDate, posts } from "./blog";
import { content, siteUrl } from "./content";
import type { Lang } from "./i18n";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/jpeg";

// En el build, process.cwd() es site/.
const file = (...parts: string[]) => readFile(path.join(process.cwd(), ...parts));

const fonts = Promise.all([file("lib/og/Anton-Regular.ttf"), file("lib/og/InstrumentSerif-Italic.ttf")]);
const photo = file("..", "db", "img", "ronald-hero.jpg").then((b) => `data:image/jpeg;base64,${b.toString("base64")}`);

const GOLD = "#E7C152";
const GOLD_DEEP = "#988858";

// Títulos largos más chicos, para que siempre entren en tres líneas.
const titleSize = (text: string) => (text.length <= 18 ? 120 : text.length <= 32 ? 96 : text.length <= 52 ? 76 : 62);

type Card = {
  /** Línea chica dorada arriba del título, p. ej. "Online · Argentina e internacional". */
  eyebrow: string;
  title: string;
  /** Frase en cursiva debajo del título. */
  accent?: string;
  /** La foto de Ronald a la derecha (no en las notas del blog). */
  withPhoto?: boolean;
};

export async function ogImage({ eyebrow, title, accent, withPhoto = true }: Card) {
  const [[anton, serif], ronald] = await Promise.all([fonts, photo]);
  const textWidth = withPhoto ? 700 : 1040;

  const png = new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#000", color: "#fff", position: "relative" }}>
        {withPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ronald}
            alt=""
            width={560}
            height={630}
            style={{ position: "absolute", right: 0, top: 0, width: 560, height: 630, objectFit: "cover", objectPosition: "center top" }}
          />
        )}
        {withPhoto && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 560,
              height: 630,
              background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.6) 22%, rgba(0,0,0,0) 55%)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: -160,
            bottom: -220,
            width: 720,
            height: 720,
            borderRadius: 720,
            background: "radial-gradient(circle, rgba(214,166,29,0.28) 0%, rgba(0,0,0,0) 65%)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: textWidth + 144, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "Anton", fontSize: 30, letterSpacing: 6, color: GOLD }}>
            <div style={{ width: 54, height: 54, borderRadius: 54, border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, letterSpacing: 0 }}>
              Z
            </div>
            ZAR DEL FITNESS
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: textWidth }}>
            <div style={{ display: "flex", fontFamily: "Anton", fontSize: 24, letterSpacing: 5, color: GOLD_DEEP, textTransform: "uppercase", marginBottom: 18 }}>
              {eyebrow}
            </div>
            <div style={{ display: "flex", fontFamily: "Anton", fontSize: titleSize(title), lineHeight: 1.1, textTransform: "uppercase", textWrap: "balance" }}>
              {title}
            </div>
            {accent && (
              <div style={{ display: "flex", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 50, color: GOLD, marginTop: 18 }}>
                {accent}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Anton", fontSize: 24, letterSpacing: 3, color: "#DCDCDC" }}>
            <div style={{ width: 48, height: 2, background: GOLD }} />
            {new URL(siteUrl).host.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serif, style: "italic", weight: 400 },
      ],
    }
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": ogContentType } });
}

// ---------- La imagen de cada página, en su idioma (las usan los opengraph-image.tsx de app/) ----------

/** El inicio: "Reto de los 25 días" con la foto de Ronald. */
export function homeImage(lang: Lang) {
  const t = content(lang).t.seo.imagenInicio;
  return { alt: t.alt, render: () => ogImage({ eyebrow: t.antetitulo, title: t.titulo, accent: t.acento }) };
}

export function blogImage(lang: Lang) {
  const t = content(lang).t.seo.imagenBlog;
  return { alt: t.alt, render: () => ogImage({ eyebrow: t.antetitulo, title: t.titulo, accent: t.acento }) };
}

/** Una nota: su categoría, fecha, título y autor, sin la foto. */
export function postImage(lang: Lang) {
  const { t } = content(lang);
  return {
    alt: t.seo.imagenNota,
    render: (slug: string) => {
      const post = posts[lang].find((p) => p.slug === slug)!;
      return ogImage({
        eyebrow: `${post.category} · ${formatDate(post.date, lang)}`,
        title: post.title,
        accent: `${t.blog.por} ${post.author}`,
        withPhoto: false,
      });
    },
  };
}
