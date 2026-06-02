#!/usr/bin/env bash
set -e
echo "🎭 Desplegando TAVA Object Roulette en Vercel..."
npm run build
npx vercel --prod
echo "✅ Despliegue completado"
