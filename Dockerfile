# syntax=docker/dockerfile:1

# @feral-auth/vue-components is a private npm package, so npm ci needs a token.
# It comes in as a build secret, mounted only while npm ci runs, so it is in no
# layer of the image:
#
#   docker build --secret id=npmrc,src=$HOME/.npmrc -t ehage/vigilant-harvest-app .
#
# where that .npmrc holds `//registry.npmjs.org/:_authToken=<a read-only token>`.

FROM node:lts-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

# Install exactly what package-lock.json names, as npm ci does locally
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc,required=true npm ci

COPY . .

RUN npm run build

# production stage: nginx as a non-root user (uid 101), listening on 8080, so
# the server publishes this container's 8080 rather than 80
FROM nginxinc/nginx-unprivileged:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html/apps/vigilant-harvest

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# Reports whether nginx is serving the app; it restarts nothing by itself.
# The app lives under /apps/vigilant-harvest/, so that's the path that
# answers 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD wget -q --spider http://127.0.0.1:8080/apps/vigilant-harvest/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
