# Self-contained static image: build the PWA, then serve dist/ with nginx.
# Deployed to umbrel via Dockge (see deploy/compose.yaml), fronted by cloudflared
# at cadence.jpc.io.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The Jellyfin base URL is baked in at build time (one server, never varies).
ARG VITE_JELLYFIN_URL=https://jellyfin.jpc.io
ENV VITE_JELLYFIN_URL=$VITE_JELLYFIN_URL
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
