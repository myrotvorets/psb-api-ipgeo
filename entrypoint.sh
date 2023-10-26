#!/bin/sh

set -e

KEYFILE=/run/secrets/geoip-encryption-password

if [ -f "${KEYFILE}" ]; then
    if [ -n "${GEOIP_CITY_FILE}" ] && [ ! -f "${GEOIP_CITY_FILE}" ] && [ -f "${GEOIP_CITY_FILE}.enc" ]; then
        /usr/bin/openssl enc -d -aes-256-cbc -pbkdf2 -iter 20000 -in "${GEOIP_CITY_FILE}.enc" -out "${GEOIP_CITY_FILE}" -kfile "${KEYFILE}"
    fi

    if [ -n "${GEOIP_ISP_FILE}" ] && [ ! -f "${GEOIP_ISP_FILE}" ] && [ -f "${GEOIP_ISP_FILE}.enc" ]; then
        /usr/bin/openssl enc -d -aes-256-cbc -pbkdf2 -iter 20000 -in "${GEOIP_ISP_FILE}.enc" -out "${GEOIP_ISP_FILE}" -kfile "${KEYFILE}"
    fi
fi

exec /usr/bin/node index.mjs
