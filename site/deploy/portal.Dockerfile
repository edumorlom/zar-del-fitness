# El portal en Railway (mi.zardelfitness.com.ar): el servidor de Next.js que arma `npm run build:portal`
# (.next-portal/standalone/, con sólo los node_modules que usa). No se construye en Railway: igual que el sitio, el
# workflow lo construye, lo copia junto a este archivo como portal/ y lo sube con `railway up`.
# La base de datos, Clerk y el bucket se configuran en las variables del servicio en Railway.
FROM node:26-slim
WORKDIR /srv
COPY portal /srv
ENV NODE_ENV=production
# Railway pone el puerto ($PORT); el servidor tiene que escuchar en todas las interfaces, no sólo en localhost.
ENV HOSTNAME=0.0.0.0
CMD ["node", "site/server.js"]
