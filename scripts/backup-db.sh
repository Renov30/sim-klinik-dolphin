#!/bin/bash
# ========================================================
# Dolphin e-Clinic - Script Backup Database PostgreSQL
# ========================================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/backup_dolphin_clinic_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Memulai backup database Dolphin e-Clinic..."

# Jika container docker berjalan
if docker ps | grep -q "dolphin_clinic_db"; then
  echo "Mengambil backup dari Docker container 'dolphin_clinic_db'..."
  docker exec -t dolphin_clinic_db pg_dump -U klinik_user -d dolphin_eclinic | gzip > "$FILENAME"
else
  echo "Docker container tidak terdeteksi aktif. Mencoba pg_dump lokal..."
  pg_dump "${DATABASE_URL:-postgresql://klinik_user:klinik_secret_pass@localhost:5432/dolphin_eclinic?schema=public}" | gzip > "$FILENAME"
fi

FILESIZE=$(du -h "$FILENAME" | cut -f1)
echo "==> Backup berhasil disimpan di: $FILENAME (Ukuran: $FILESIZE)"

