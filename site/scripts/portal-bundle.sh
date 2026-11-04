#!/usr/bin/env bash
# Arma en $1 lo que se sube al servicio del portal en Railway: deploy/portal.Dockerfile como Dockerfile y el servidor
# de `npm run build:portal` en portal/, con los archivos que Next.js no copia solo al standalone (los .js y .css del
# navegador, y el logo del menú).
set -euo pipefail
cd "$(dirname "$0")/.."
out="$1"
rm -rf "$out" && mkdir -p "$out"
cp deploy/portal.Dockerfile "$out/Dockerfile"
cp -R .next-portal/standalone "$out/portal"
cp -R .next-portal/static "$out/portal/site/.next-portal/static"
mkdir -p "$out/portal/site/public/img"
cp public/img/logo.webp "$out/portal/site/public/img/"
