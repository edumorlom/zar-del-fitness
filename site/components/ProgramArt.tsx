// Arte de las tarjetas de programas. SVG inline (no <img>) para que use las tipografías del sitio.
import type { ProgramArtVariant } from "@/lib/content";
import styles from "./ProgramArt.module.css";

const W = 800;
const H = 500;
const CX = W / 2;
const CY = H / 2;
const INK = "#1a1407";

// Borde festoneado del sello: r(θ) = R + a·cos(nθ)
const scallop = Array.from({ length: 360 }, (_, i) => {
  const t = (i / 360) * Math.PI * 2;
  const r = 200 + 5 * Math.cos(36 * t);
  return `${(CX + r * Math.cos(t)).toFixed(1)},${(CY + r * Math.sin(t)).toFixed(1)}`;
}).join(" ");

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3e3ad" />
        <stop offset="0.42" stopColor="#e7c152" />
        <stop offset="0.52" stopColor="#a7892f" />
        <stop offset="0.75" stopColor="#d6a61d" />
        <stop offset="1" stopColor="#f3e3ad" />
      </linearGradient>
      <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#dcdcdc" />
        <stop offset="0.56" stopColor="#9a9a9a" />
        <stop offset="1" stopColor="#f2f2f2" />
      </linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3e3ad" />
        <stop offset="0.3" stopColor="#d6a61d" />
        <stop offset="0.5" stopColor="#a7892f" />
        <stop offset="0.7" stopColor="#e7c152" />
        <stop offset="1" stopColor="#988858" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stopColor="#d6a61d" stopOpacity="0.22" />
        <stop offset="1" stopColor="#d6a61d" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-streak`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#e7c152" stopOpacity="0" />
        <stop offset="0.5" stopColor="#e7c152" stopOpacity="0.55" />
        <stop offset="1" stopColor="#e7c152" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

function Backdrop({ id, double }: { id: string; double?: boolean }) {
  return (
    <>
      <rect width={W} height={H} fill="#060606" />
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      <g fill={`url(#${id}-streak)`} opacity="0.35">
        <polygon points="-60,500 10,500 460,0 430,0" />
        <polygon points="420,500 436,500 860,40 852,40" />
        <polygon points="560,520 640,520 900,180 860,180" />
      </g>
      <rect x="18" y="18" width={W - 36} height={H - 36} rx="10" fill="none" stroke="#988858" strokeOpacity="0.45" />
      {double && <rect x="28" y="28" width={W - 56} height={H - 56} rx="6" fill="none" stroke="#988858" strokeOpacity="0.25" />}
    </>
  );
}

// Texto con sombra para darle volumen sobre el fondo
function Title({ y, size, fill, className, spacing = 0, children }: {
  y: number;
  size: number;
  fill: string;
  className: string;
  spacing?: number;
  children: string;
}) {
  const props = { x: CX + spacing / 2, fontSize: size, letterSpacing: spacing, textAnchor: "middle", className } as const;
  return (
    <>
      <text {...props} y={y + size * 0.035} fill="#000" opacity="0.7">
        {children}
      </text>
      <text {...props} y={y} fill={fill}>
        {children}
      </text>
    </>
  );
}

function Subtitle({ y, children }: { y: number; children: string }) {
  return (
    <g>
      <text x={CX + 4.5} y={y} fontSize="19" letterSpacing="9" textAnchor="middle" fill="#dcdcdc" className={styles.sans}>
        {children}
      </text>
      <path d={`M${CX - 270} ${y - 7}h70M${CX + 200} ${y - 7}h70`} stroke="#988858" strokeWidth="1.5" />
    </g>
  );
}

function Sistema({ id, variant }: { id: string; variant: "online" | "premium" }) {
  const word = variant === "online" ? "ONLINE" : "PREMIUM";
  return (
    <>
      <Title y={170} size={92} fill={`url(#${id}-silver)`} className={styles.serif}>
        Sistema
      </Title>
      <Title y={336} size={variant === "online" ? 176 : 162} spacing={4} fill={`url(#${id}-gold)`} className={styles.display}>
        {word}
      </Title>
      <Subtitle y={394}>DE ENTRENAMIENTO</Subtitle>
    </>
  );
}

function General({ id }: { id: string }) {
  return (
    <>
      <Title y={140} size={78} fill={`url(#${id}-silver)`} className={styles.serif}>
        Sistema
      </Title>
      <Title y={268} size={124} spacing={3} fill={`url(#${id}-gold)`} className={styles.display}>
        GENERAL
      </Title>
      <Title y={388} size={124} spacing={3} fill={`url(#${id}-gold)`} className={styles.display}>
        DIRIGIDO
      </Title>
    </>
  );
}

function Seal({ id }: { id: string }) {
  const sparkle = (x: number) => (
    <path d={`M${x} ${CY - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`} fill={INK} />
  );
  return (
    <>
      <circle cx={CX} cy={CY + 10} r="200" fill="#000" opacity="0.6" />
      <polygon points={scallop} fill={`url(#${id}-metal)`} />
      <circle cx={CX} cy={CY} r="180" fill="none" stroke={INK} strokeWidth="2.5" />
      <circle cx={CX} cy={CY} r="174" fill="none" stroke={INK} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx={CX} cy={CY} r="126" fill={`url(#${id}-gold)`} stroke={INK} strokeWidth="2.5" />
      <path id={`${id}-top`} d={`M${CX - 144} ${CY}A144 144 0 0 1 ${CX + 144} ${CY}`} fill="none" />
      <path id={`${id}-bottom`} d={`M${CX - 162} ${CY}A162 162 0 0 0 ${CX + 162} ${CY}`} fill="none" />
      <text fontSize="25" letterSpacing="5" fill={INK} className={styles.sans}>
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          COMIENZA EL RETO
        </textPath>
      </text>
      <text fontSize="25" letterSpacing="5" fill={INK} className={styles.sans}>
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          INTERNACIONAL
        </textPath>
      </text>
      {sparkle(CX - 153)}
      {sparkle(CX + 153)}
      <text x={CX + 3} y={196} fontSize="22" letterSpacing="6" textAnchor="middle" fill={INK} className={styles.sans}>
        DE LOS
      </text>
      <text x={CX} y={306} fontSize="128" textAnchor="middle" fill={INK} className={styles.display}>
        25
      </text>
      <text x={CX + 3} y={342} fontSize="24" letterSpacing="6" textAnchor="middle" fill={INK} className={styles.sans}>
        DÍAS
      </text>
      <path d={`M${CX - 92} 334h40M${CX + 52} 334h40`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

export function ProgramArt({ variant, label }: { variant: ProgramArtVariant; label: string }) {
  // Cada variante aparece una sola vez en la página, así que su nombre alcanza como prefijo de ids.
  const id = `art-${variant}`;
  return (
    <svg className={styles.art} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <Defs id={id} />
      <Backdrop id={id} double={variant === "premium"} />
      {(variant === "online" || variant === "premium") && <Sistema id={id} variant={variant} />}
      {variant === "general" && <General id={id} />}
      {variant === "reto" && <Seal id={id} />}
    </svg>
  );
}
