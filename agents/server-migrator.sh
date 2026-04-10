#!/bin/bash

# ==============================================================================
# SERVER PROJECT FIX & MIGRATION AGENT
# ==============================================================================
# Maqsad: /tmp, /opt, /var/www kabi joylarda qolib ketgan loyihalarni
# /root/Projects/ papkasiga to'g'ri ko'chirish va Nginx yo'llarini avtomatik to'g'rilash.
# O'rnatish tartibi:
# 1. chmod +x server-migrator.sh
# 2. ./server-migrator.sh
# ==============================================================================

# Xatolarda to'xtatish
set -e

# O'zgaruvchilar
TARGET_DIR="/root/Projects"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
LOG_FILE="/var/log/server_migrator_agent.log"

echo "[AGENT] Ish boshlanmoqda. Natijalar ${LOG_FILE} ga yoziladi..."
exec > >(tee -a ${LOG_FILE}) 2>&1

echo "============================================="
echo "[1] TARGET PAPKANI YARATISH"
echo "============================================="
mkdir -p "${TARGET_DIR}"
echo "Yaratildi: ${TARGET_DIR}"

echo "============================================="
echo "[2] LOYIHALARNI QIDIRISH VA KO'CHIRISH"
echo "============================================="
# Odatda package.json ni o'z ichiga olgan papkalarni qayta joylashtiramiz
# /opt, /var/www, /tmp ichidan 3-chi darajagacha izlaymiz
FOUND_PROJECTS=$(find /opt /var/www -maxdepth 3 -type f -name "package.json" 2>/dev/null | xargs dirname | sort -u || true)

if [ -z "$FOUND_PROJECTS" ]; then
    echo "Eski /opt yoki /var/www da ko'chirish uchun loyihalar topilmadi."
else
    for PROJECT_PATH in $FOUND_PROJECTS; do
        BASENAME=$(basename $PROJECT_PATH)
        NEW_PATH="${TARGET_DIR}/${BASENAME}"
        
        if [ "$PROJECT_PATH" == "$NEW_PATH" ]; then
            continue
        fi

        echo "=> Ko'chirilmoqda: $PROJECT_PATH -> $NEW_PATH"
        mv "$PROJECT_PATH" "$NEW_PATH"

        # Nginx ichida ushbu pathlarni izlab, yangilab qoldiramiz
        if [ -d "$NGINX_AVAILABLE" ]; then
            echo "   Nginx (.conf) larni yangilash: $PROJECT_PATH ni $NEW_PATH qilib o'zgartirish..."
            # grep orqali eski pathni tekshiramiz va sed orqali yangilaymiz
            grep -rl "$PROJECT_PATH" $NGINX_AVAILABLE/ | while read -r conf_file ; do
                sed -i "s|$PROJECT_PATH|$NEW_PATH|g" "$conf_file"
                echo "     - Yangilandi: $conf_file"
            done
        fi
    done
fi

echo "============================================="
echo "[3] /TMP IChIDAGI LOYIHALAR"
echo "============================================="
# /tmp dagi narsalar tozalanish xavfi bor, ularni tezroq olamiz
TMP_PROJECTS=$(find /tmp -maxdepth 3 -type f -name "package.json" 2>/dev/null | xargs dirname | sort -u || true)

if [ -n "$TMP_PROJECTS" ]; then
    for TMP_PATH in $TMP_PROJECTS; do
        BASENAME=$(basename $TMP_PATH)
        NEW_PATH="${TARGET_DIR}/${BASENAME}_temp"
        echo "=> /tmp dan olinmoqda: $TMP_PATH -> $NEW_PATH"
        mv "$TMP_PATH" "$NEW_PATH"
        
        grep -rl "$TMP_PATH" $NGINX_AVAILABLE/ 2>/dev/null | while read -r conf_file ; do
            sed -i "s|$TMP_PATH|$NEW_PATH|g" "$conf_file"
            echo "     - Yangilandi: $conf_file"
        done
    done
fi

echo "============================================="
echo "[4] NGINX VA SSL KONFIGURATSIYALARINI TEKSHIRISH"
echo "============================================="
nginx -t || { echo "Nginx xatolik berdi, sozlamalarni tekshiring!"; exit 1; }

echo "============================================="
echo "[5] NGINX NI QAYTA ISHGA TUSHIRISH"
echo "============================================="
systemctl reload nginx
echo "Nginx muvaffaqiyatli ishga tushirildi."
echo ""
echo "[AGENT] Barcha ishlar muvaffaqiyatli yakunlandi."
echo "Loyihalaringiz quyidagi papkada turibdi:"
ls -la ${TARGET_DIR}
