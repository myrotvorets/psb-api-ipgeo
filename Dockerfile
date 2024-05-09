FROM myrotvorets/node-build:latest@sha256:8c31f57f0693e130401a613fe6a3d8bbb61fa672afb1e549aee5c66abdba7834 AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:88f1b52cc4dfae24fd1d16bbb671b01075e8b8f654069eb9c0c28a0bee27b180
USER root
WORKDIR /srv/service
RUN \
    chown nobody:nobody /srv/service && \
    apk add --no-cache openssl && \
    install -d -o nobody -g nobody /usr/share/GeoIP && \
    wget https://cdn.myrotvorets.center/m/geoip/GeoIP2-City.mmdb.enc?_=20240219 -U "Mozilla/5.0" -O /usr/share/GeoIP/GeoIP2-City.mmdb.enc && \
    wget https://cdn.myrotvorets.center/m/geoip/GeoIP2-ISP.mmdb.enc?_=20240219 -U "Mozilla/5.0" -O /usr/share/GeoIP/GeoIP2-ISP.mmdb.enc
USER nobody:nobody
COPY entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody ./package.json ./
