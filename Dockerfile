# Self-contained static image: build the PWA, then serve dist/ with nginx.
# Deployed to umbrel via Dockge (see deploy/compose.yaml), fronted by cloudflared
# at cadence.jpc.io.
#
# The build stage is pinned to $BUILDPLATFORM so the heavy Node/Vite build always
# runs NATIVELY on the CI runner (never under QEMU emulation) even for arm64
# targets — the output dist/ is static and arch-independent, so only the tiny
# final nginx layer differs per arch. Keeps multi-arch publishes ~2min instead
# of ~40min of emulated `npm ci`.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Optional build-time default Jellyfin URL. EMPTY by default so the public image
# is server-agnostic — each self-hoster enters their server at sign-in (see
# serverUrlStore). The maintainer's deploy (deploy/compose.yaml) passes its own
# URL as this build-arg to prefill the field for cadence.jpc.io users.
ARG VITE_JELLYFIN_URL=
ENV VITE_JELLYFIN_URL=$VITE_JELLYFIN_URL
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Regenerate /config.js from env (e.g. SIGNUP_URL) at container startup, before
# nginx boots — nginx:alpine runs every /docker-entrypoint.d/*.sh first. This
# keeps runtime settings OUT of the built image (set them per-deployment).
COPY deploy/runtime-config.sh /docker-entrypoint.d/40-cadence-config.sh
RUN chmod +x /docker-entrypoint.d/40-cadence-config.sh
EXPOSE 80
