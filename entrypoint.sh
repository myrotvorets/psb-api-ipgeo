#!/bin/sh

set -x
set -e

[ -f /run/secrets/geoip-encryption-password ] || {
    echo "FATAL: /run/secrets/geoip-encryption-password not found"
    exit 1
}

[ -f /usr/share/GeoIP/GeoIP2-City.mmdb ] || \
    /usr/bin/openssl enc -d -aes-256-cbc -pbkdf2 -iter 20000 -in /usr/share/GeoIP/GeoIP2-City.mmdb.enc -out /usr/share/GeoIP/GeoIP2-City.mmdb -kfile /run/secrets/geoip-encryption-password


[ -f /usr/share/GeoIP/GeoIP2-ISP.mmdb ] || \
    /usr/bin/openssl enc -d -aes-256-cbc -pbkdf2 -iter 20000 -in /usr/share/GeoIP/GeoIP2-ISP.mmdb.enc -out /usr/share/GeoIP/GeoIP2-ISP.mmdb -kfile /run/secrets/geoip-encryption-password

rm -f /run/secrets/geoip-encryption-password || true

exec /usr/bin/node index.mjs
