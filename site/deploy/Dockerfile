# El sitio en Railway: los archivos de site/out/ servidos por Caddy, con las reglas de Caddyfile (las de
# public/.htaccess). No se construye en Railway: el workflow arma site/out/ (con la historia de git, para las fechas
# del sitemap), lo copia junto a este archivo como out/ y lo sube con `railway up`.
FROM caddy:2.10.2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY out /srv
