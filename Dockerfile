# Self-contained static image: build the PWA, then serve dist/ with nginx.
# Deployed to umbrel via Dockge (see deploy/compose.yaml), fronted by cloudflared
# at cadence.jpc.io.
FROM node:22-alpine AS build
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
EXPOSE 80
