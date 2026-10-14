#!/bin/sh
set -e

echo "==> Menyiapkan database Dolphin e-Clinic..."
npx prisma db push --skip-generate

echo "==> Memeriksa & menjalankan database seed..."
npx prisma db seed || echo "Seed selesai atau sudah ada data."

echo "==> Menjalankan Dolphin e-Clinic di port $PORT..."
exec npm run start

