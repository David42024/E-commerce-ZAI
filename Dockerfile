# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---------------- DEPENDENCIAS ----------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

# ---------------- BUILD ----------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Backend
RUN npm run build --workspace=backend

# Prisma client
RUN npm run prisma:generate --workspace=backend

# Frontend
RUN npm run build --workspace=frontend

# Compilar seed.ts → JS
RUN cd backend && npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --resolveJsonModule --target es2020 --module commonjs

# ---------------- RUNTIME ----------------
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY backend/prisma backend/prisma
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist

EXPOSE 3000

# ORDEN CORRECTO:
# 1. Migraciones (siempre, aplica cualquier ALTER TABLE pendiente)
# 2. Seed (solo si activas flag)
# 3. Start backend

CMD ["sh", "-c", "\
echo 'Running migrations...' && \
npx prisma migrate deploy --schema backend/prisma/schema.prisma && \
if [ \"$RUN_SEED\" = \"true\" ]; then \
  echo 'Running seed...' && node backend/dist/prisma/seed.js; \
else \
  echo 'Skipping seed'; \
fi && \
npm run start --workspace=backend"]