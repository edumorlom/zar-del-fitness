// Contenido del sitio. Todo el copy, precios y links viven acá para editarlos en un solo lugar.

const WA_NUMBER = "5491127336258";

export const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export const links = {
  retoOnline: wa("Hola! Quiero inscribirme en el Reto de los 25 días online"),
  presencialCheckout: wa("Hola! Quiero inscribirme en el Sistema Premium presencial"),
  generalCheckout: wa("Hola! Quiero inscribirme en el Sistema General Dirigido"),
  hashtag: "https://www.instagram.com/explore/tags/loscuerposdelzar/",
  directions:
    "https://www.google.com/maps/dir/?api=1&destination=Alvarez+Thomas+847,+Colegiales,+CABA",
  mapEmbed:
    "https://www.google.com/maps?q=Alvarez+Thomas+847,+Colegiales,+Buenos+Aires&output=embed",
  waInfo: wa("Hola! Quiero información sobre los sistemas de entrenamiento del Zar."),
  waPresencial: wa("Hola! Quiero consultar sobre el Entrenamiento Presencial"),
  waInternacional: wa("Hola! Quiero el Reto de los 25 días online internacional"),
  waDudas: wa("Hola! Tengo una duda sobre el reto"),
};

export const contact = {
  phone: "+54 9 11 2733-6258",
  phoneHref: `https://wa.me/${WA_NUMBER}`,
  email: "contacto@zardelfitness.com.ar",
  address: "Álvarez Thomas 847, Colegiales, CABA",
  gym: "The VIP by Zar del Fitness · Exclusive Gym",
};

export const socials = [
  { label: "Instagram", icon: "ig", href: "https://www.instagram.com/zardelfitness/" },
  { label: "Facebook", icon: "fb", href: "https://www.facebook.com/zardelfitness" },
  { label: "YouTube", icon: "yt", href: "https://www.youtube.com/user/MODELNUTRITION" },
  { label: "TikTok", icon: "tt", href: "https://vm.tiktok.com/ZMJbSAgWe/" },
  { label: "X (Twitter)", icon: "x", href: "https://twitter.com/zardelfitness" },
] as const;

export const nav = [
  { href: "#programas", label: "Programas" },
  { href: "#metodo", label: "Método" },
  { href: "#resultados", label: "Resultados" },
  { href: "#zar", label: "El Zar" },
  { href: "#gym", label: "The VIP" },
  { href: "#faq", label: "FAQ" },
];

export const videos = {
  trailer: "QyVRVi3y6IQ",
  historia: "eZF-MLaF45g",
};

export type Program = {
  tag: string;
  title: string;
  currency: string;
  price: string;
  suffix?: string;
  desc: string;
  features: string[];
  image: { src: string; alt: string; w: number; h: number; contain?: boolean };
  cta: { label: string; href: string };
  featured?: boolean;
};

export const programs: Program[] = [
  {
    tag: "Online · Argentina",
    title: "Reto de los 25 días",
    currency: "$",
    price: "100.000",
    suffix: "ARS",
    desc: "Entrená en casa o en el gym con videos diseñados para tu sistema, a tu ritmo y en tu horario.",
    features: [
      "Evaluación a distancia",
      "Plan de alimentación individual",
      "Plan de suplementación individual",
      "Rutina en video (casa o gym)",
      "Controles cada 15 días",
      "Asistencia permanente por WhatsApp",
    ],
    image: { src: "/img/sistema-online.webp", alt: "Sistema online de entrenamiento", w: 1024, h: 683 },
    cta: { label: "Inscribirme", href: links.retoOnline },
  },
  {
    tag: "Presencial · The VIP",
    title: "Sistema Premium",
    currency: "$",
    price: "450.000",
    suffix: "ARS",
    desc: "Entrená directamente con el Zar y sus dos asistentes premium en un gimnasio exclusivo, con horarios que se adaptan a vos.",
    features: [
      "Consulta antropométrica y evaluación física",
      "Plan personalizado con el Zar + 2 asistentes",
      "Gimnasio The VIP incluido y exclusivo",
      "Bebidas premium e hidratación libre",
      "Médico traumatólogo exclusivo",
      "Traé un amigo una vez al mes",
    ],
    image: { src: "/img/sistema-premium.webp", alt: "Sistema premium de entrenamiento by Zar del Fitness", w: 1024, h: 683 },
    cta: { label: "Inscribirme", href: links.presencialCheckout },
    featured: true,
  },
  {
    tag: "Presencial · The VIP",
    title: "Sistema General Dirigido",
    currency: "$",
    price: "170.000",
    suffix: "ARS",
    desc: "Entrená directamente con el Zar y su equipo de asistentes en The VIP, cuando te resulte más cómodo dentro de las franjas horarias.",
    features: [
      "Consulta inicial: % de grasa, peso y estatura",
      "Controles mensuales con cita previa",
      "Plan de entrenamiento con los asistentes del Zar",
      "Entrenamiento supervisado y compartido",
      "Gimnasio The VIP incluido",
      "Lunes a viernes, clases de 1\u00a0h\u00a020\u00a0min",
    ],
    image: { src: "/img/sistema-general.webp", alt: "Sistema General Dirigido by Zar del Fitness", w: 1024, h: 640 },
    cta: { label: "Inscribirme", href: links.generalCheckout },
  },
  {
    tag: "Online · Internacional",
    title: "Reto Internacional",
    currency: "USD",
    price: "100",
    desc: "El mismo método, desde cualquier país. Seguimiento por WhatsApp durante todo el reto.",
    features: [
      "Evaluación a distancia",
      "Plan nutricional a medida",
      "Plan de entrenamiento",
      "Controles día 1, 15 y 25",
      "Suplementación deportiva (si se requiere)",
    ],
    image: { src: "/img/reto-seal.webp", alt: "Sello: comienza el reto de los 25 días by Ronald Medina", w: 800, h: 800, contain: true },
    cta: { label: "Quiero empezar", href: links.waInternacional },
  },
];

export const steps = [
  { n: "01", title: "Inscripción", text: "Te inscribís y completás un cuestionario sobre tus objetivos, hábitos y antecedentes." },
  { n: "02", title: "Evaluación", text: "Analizamos tu punto de partida para prescribirte un plan 100% individual." },
  { n: "03", title: "Tu plan", text: "Recibís tu plan de alimentación, suplementación y entrenamiento, adaptado a casa o gimnasio." },
  { n: "04", title: "Entrenás", text: "Videos diseñados para tu sistema: entrenás cuando te resulte más cómodo, con asistencia por WhatsApp." },
  { n: "05", title: "Controles", text: "Cada 15 días nos enviás fotos y tu peso. Ajustamos el plan sólo si es importante para tu avance." },
  { n: "25", title: "Resultados", text: "Día 25: medimos, celebramos y vamos por el próximo objetivo." },
];

export const benefits = [
  ["Bajar tu % de grasa", "sin sacrificar músculo"],
  ["Bajar talles de pantalón", "o vestido"],
  ["Tonificar y desarrollar", "masa muscular"],
  ["Construir buenos", "hábitos alimenticios"],
  ["Ganar un estilo de vida", "saludable"],
] as const;

export type Shot = { src: string; w: number; h: number; alt: string };
const shot = (n: string, w: number, h: number, alt = "Transformación de un alumno: antes y después"): Shot => ({
  src: `/img/t${n}.webp`, w, h, alt,
});

export const transformations: Shot[][] = [
  [
    shot("03", 900, 860),
    shot("09", 900, 888),
    shot("13", 900, 900),
    shot("04", 1100, 782, "Dos transformaciones de alumnos: antes y después"),
    shot("10", 600, 593, "Transformación de una alumna: antes y después"),
    shot("02", 600, 599),
  ],
  [
    shot("11", 900, 923),
    shot("05", 600, 602, "Transformación de una alumna: antes y después"),
    shot("07", 900, 746),
    shot("12", 600, 603),
    shot("01", 900, 900, "Transformación de una alumna: antes y después"),
    shot("08", 600, 597),
    shot("06", 900, 804),
  ],
];

export const perks = [
  ["Consulta antropométrica", "Evaluación completa sobre tus objetivos y tu evolución física para optimizar tu entrenamiento de forma constante."],
  ["Evaluación física y estratégica", "A disponibilidad de Zar del Fitness, sin restricciones."],
  ["Sugerencia alimentaria y suplementaria", "Orientación para comer más sano y enfocado en tu objetivo. Si querés un seguimiento nutricional más profesional, te recomendamos sumar un nutricionista."],
  ["Plan de entrenamiento personalizado", "Con entrenador personal a cargo de @zardelfitness y 2 asistentes premium."],
  ["Gimnasio The VIP by Zar del Fitness", "Incluido en el costo y exclusivo para este servicio."],
  ["Hidratación libre", "Agua con gas y sin gas."],
  ["Bebidas premium", "Pre-entreno, aminoácidos y whey protein (sujetos a disponibilidad)."],
  ["Acceso con huella dactilar", "Entrás al gimnasio sin llaves ni tarjetas."],
  ["Pausá tu sistema", "Hasta una semana, en caso de viaje o eventualidades de fuerza mayor."],
  ["Médico traumatólogo", "Exclusivo para alumnos premium."],
  ["Traé un amigo", "Invitá a un amigo a un día de prueba sin costo, una vez al mes."],
] as const;

// Horario del gimnasio (hora de Buenos Aires, lunes a viernes). Horas en decimal: 14.5 = 14:30.
export const schedule = {
  timeZone: "America/Argentina/Buenos_Aires",
  days: [1, 2, 3, 4, 5],
  slots: [
    { from: 8, to: 12, lastEntry: "11:00", label: "8:00 – 12:00" },
    { from: 14.5, to: 21, lastEntry: "20:00", label: "14:30 – 21:00" },
  ],
  range: { from: 7, to: 22 },
};

export const press = [
  { src: "Emmy 2024", title: "Detrás del espejo: el lado oscuro del fitness", kind: "Premio", href: "https://youtu.be/g-ENoAJHebQ", preview: "/img/press-emmy.webp" },
  { src: "TN", title: "La historia del entrenador de los famosos", kind: "Entrevista", href: "https://tn.com.ar/show/basicas/la-dura-historia-de-ronald-medina-el-entrenador-de-los-famosos-que-se-fue-de-venezuela-despues-de_866544/", preview: "/img/ronald-portrait.webp" },
  { src: "Olé", title: "Fitness con el Zar", kind: "Entrevista", href: "https://www.ole.com.ar/running/fitness_0_SvUQ4lGRR.html", preview: "/img/ronald-white.webp" },
  { src: "Pronto", title: "El cambio de Rodrigo Noya en 25 días", kind: "Transformación", href: "https://www.pronto.com.ar/articulo/famosos/antes-despues-tremendo-cambio-fisico-rodrigo-noya-25-dias/20180922160638298499.html", preview: "/img/t09.webp" },
  { src: "Funcional Magazine", title: "Portada: “Fitness con propósito”", kind: "Revista", preview: "/img/press-funcional.webp" },
  { src: "TV", title: "Crónicas de Lirio (C5N) · La tarde con vos · Quedate con Georgina", kind: "Televisión", preview: "/img/ronald-seated.webp" },
];

export const awards = [
  { year: "2014", title: "Chiquinquirá de Oro", text: "Personal trainer de mayor prestigio del año · Maracaibo" },
  { year: "2017", title: "Occamy Internacional", text: "Instructor deportivo" },
  { year: "Hoy", title: "Revista Cuerpo y Mente", text: "Articulista · Orador motivacional para Remax" },
];

export const team = [
  {
    role: "Fundador · Head coach",
    name: "Ronald Medina",
    bio: "Creador del Reto de los 25 días. Su método cuenta con un equipo multidisciplinario para el control de peso y la definición muscular.",
    img: { src: "/img/ronald-hero.jpg", w: 1218, h: 1291 },
    handle: "@zardelfitness",
  },
  {
    role: "Entrenador",
    name: "Edwards Chacín",
    bio: "Entrenador certificado por el Instituto Panamericano de Educación Física (Universidad del Zulia). Certificación en nutrición para el incremento de la masa muscular.",
    img: { src: "/img/edwards-chacin.jpg", w: 1320, h: 1447 },
  },
];

export const faqs = [
  ["¿El reto de los 25 días es para cualquier persona?", "Sí. El protocolo es individual: se diseña según tus objetivos, tu nivel y tus limitaciones."],
  ["Nunca entrené, ¿puedo hacer el reto?", "Claro que sí. Nuestro sistema responde a un protocolo que va de menor a mayor intensidad, según tu progreso."],
  ["¿Puedo entrenar en casa o en el gym?", "Sí. Diseñamos la rutina de entrenamiento según tus requerimientos y el lugar donde vas a entrenar."],
  ["Tengo alguna enfermedad, ¿puedo entrenar?", "Siempre que tu médico lo autorice. Trabajamos en función de tus limitaciones para establecer un objetivo seguro."],
  ["¿Se puede hacer siendo menor de edad?", "Sí, siempre y cuando la inscripción la haga su representante."],
  ["¿La rutina es muy agresiva?", "No, todo es progresivo e individual."],
  ["¿Los profes están certificados?", "Sí, estamos formados como profesionales del entrenamiento personalizado."],
  ["¿Puedo pausar el Sistema Premium?", "Sí, hasta por una semana en caso de viaje o eventualidades de fuerza mayor."],
  ["¿Puedo pausar el Sistema General Dirigido?", "No. No se pueden pausar días por viajes ni por situaciones ajenas a nuestro servicio."],
] as const;
