FROM node:26.7.0-bookworm-slim AS builder

WORKDIR /app

# Install Python and scientific libraries for build-time diagram rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-matplotlib \
    python3-numpy \
    python3-pandas \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Install Playwright Chromium for CI
RUN npx playwright install --with-deps chromium

# Build the static site
COPY . .
RUN npm run build:all

FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
