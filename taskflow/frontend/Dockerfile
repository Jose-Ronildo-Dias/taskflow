FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine
USER root
RUN apk add --no-cache ca-certificates \
    && mkdir -p /etc/nginx/snippets
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/15-backend-vars.envsh /docker-entrypoint.d/15-backend-vars.envsh
RUN chmod 0555 /docker-entrypoint.d/15-backend-vars.envsh
COPY --from=build /app/dist /usr/share/nginx/html
USER 101

ENV PORT=8080 \
    BACKEND_URL=http://backend:8080 \
    NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL|BACKEND_HOST|BACKEND_SNI|NGINX_RESOLVER)$"
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1
