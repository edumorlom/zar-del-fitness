# El portal en Railway. Se construye desde la raíz del repo (RAILWAY_DOCKERFILE_PATH=app/Dockerfile): usa los estilos
# y las animaciones de site/ y los datos de db/.
FROM node:26-slim

WORKDIR /repo

# Las dependencias de site/ (gsap, lenis) las importan sus componentes de animación; las de desarrollo también, porque
# TypeScript revisa esos componentes con los tipos de React de site/.
COPY site/package.json site/package-lock.json site/.npmrc site/
RUN cd site && npm ci --ignore-scripts
COPY app/package.json app/package-lock.json app/.npmrc app/
RUN cd app && npm ci --ignore-scripts

COPY site/tsconfig.json site/
COPY site/app/globals.css site/app/
COPY site/components site/components
COPY site/lib site/lib
COPY db db
COPY app app

WORKDIR /repo/app
# La clave pública de Clerk va en el código del navegador: hace falta al construir, no sólo al correr.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "start"]
