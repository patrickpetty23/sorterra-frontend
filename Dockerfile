# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
RUN npm ci

# Vite bakes VITE_* variables into the bundle at build time.
# Pass the correct values for each environment via --build-arg.
ARG VITE_API_BASE_URL
ARG VITE_COGNITO_REGION
ARG VITE_COGNITO_USER_POOL_ID
ARG VITE_COGNITO_APP_CLIENT_ID

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_COGNITO_REGION=$VITE_COGNITO_REGION
ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
ENV VITE_COGNITO_APP_CLIENT_ID=$VITE_COGNITO_APP_CLIENT_ID

COPY . .
RUN npm run build

# ============================================
# Stage 2: Serve
# ============================================
FROM nginx:1.27-alpine AS final

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
