#!/usr/bin/env bash
# Arma en $1 lo que se sube a Railway: deploy/Dockerfile y el servidor de `npm run build` en app/, con lo que Next.js
# no copia solo a .next/standalone/: los .js y .css del navegador (.next/static/) y public/ (las fotos y sus copias).
set -euo pipefail
cd "$(dirname "$0")/.."
out="$1"
rm -rf "$out" && mkdir -p "$out"
cp deploy/Dockerfile "$out/Dockerfile"
cp -R .next/standalone "$out/app"
mkdir -p "$out/app/site/.next/static" "$out/app/site/public"
cp -R .next/static/. "$out/app/site/.next/static/"
cp -R public/. "$out/app/site/public/"
