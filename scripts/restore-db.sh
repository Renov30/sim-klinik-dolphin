#!/bin/bash
# ========================================================
# Dolphin e-Clinic - Script Restore Database PostgreSQL
# ========================================================

set -e

if [ -z "$1" ]; then
  echo "Penggunaan: ./scripts/restore-db.sh <path_to_backup_file.sql.gz>"
  echo "Contoh: ./scripts/restore-db.sh ./backups/backup_dolphin_clinic_20261014_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File backup '$BACKUP_FILE' tidak ditemukan!"
  exit 1
fi

echo "==> Memulihkan database dari $BACKUP_FILE..."

if docker ps | grep -q "dolphin_clinic_db"; then
  gunzip -c "$BACKUP_FILE" | docker exec -i dolphin_clinic_db psql -U klinik_user -d dolphin_eclinic
else
  gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL:-postgresql://klinik_user:klinik_secret_pass@localhost:5432/dolphin_eclinic?schema=public}"
fi

echo "==> Pemulihan database berhasil!"

