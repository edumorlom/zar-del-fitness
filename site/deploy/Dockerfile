# El sitio y el portal en Railway: el servidor de Next.js que arma `npm run build` (.next/standalone/, con sólo los
# node_modules que usa). No se construye en Railway: el workflow lo construye (con la historia de git, para las fechas
# del sitemap), lo arma con scripts/deploy-bundle.sh junto a este archivo como app.tar y lo sube con `railway up`.
# La base de datos, Clerk y el bucket del portal se configuran en las variables del servicio en Railway.
FROM node:26-slim
WORKDIR /srv
# ADD abre el .tar en /srv.
ADD app.tar /srv
ENV NODE_ENV=production
# Railway pone el puerto ($PORT); el servidor tiene que escuchar en todas las interfaces, no sólo en localhost.
ENV HOSTNAME=0.0.0.0
CMD ["node", "site/server.js"]
