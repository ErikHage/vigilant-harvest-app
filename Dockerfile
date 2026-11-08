FROM node:lts-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

# Install exactly what package-lock.json names, as npm ci does locally
RUN npm ci

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
