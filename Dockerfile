FROM myrotvorets/node-build:latest@sha256:79ab331c596baeceb223311e8a4ce047ffd27243765dedf98421b900be9ffd3a AS base
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc ./

FROM base AS deps
RUN npm ci --only=prod

FROM base AS build
RUN \
    npm r --package-lock-only \
        eslint @myrotvorets/eslint-config-myrotvorets-ts @typescript-eslint/eslint-plugin eslint-plugin-import eslint-plugin-prettier prettier eslint-plugin-sonarjs eslint-plugin-jest eslint-formatter-gha \
        @types/jest jest ts-jest merge supertest @types/supertest jest-sonar-reporter jest-github-actions-reporter \
        nodemon && \
    npm ci --ignore-scripts && \
    rm -f .npmrc && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false

FROM myrotvorets/node-min@sha256:c8386cf43d66e15c1d9b049371533dd37968357756eb77cf5e2119b380178154
USER root
WORKDIR /srv/service
RUN \
    chown nobody:nobody /srv/service && \
    apk add --no-cache openssl && \
    install -d -o nobody -g nobody /usr/share/GeoIP && \
    wget https://psb4ukr.natocdn.net/geoip/GeoIP2-City.mmdb.enc -U "Mozilla/5.0" -O /usr/share/GeoIP/GeoIP2-City.mmdb.enc && \
    wget https://psb4ukr.natocdn.net/geoip/GeoIP2-ISP.mmdb.enc -U "Mozilla/5.0" -O /usr/share/GeoIP/GeoIP2-ISP.mmdb.enc
COPY healthcheck.sh entrypoint.sh /usr/local/bin/
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 CMD ["/usr/local/bin/healthcheck.sh"]
USER nobody:nobody
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
COPY --chown=nobody:nobody ./src/specs ./specs
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
