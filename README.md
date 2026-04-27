# ZAI Commerce

Repositorio para la aplicación full-stack (Express + Prisma backend, React + Vite frontend).

## Resumen

- Backend: carpeta `backend` (TypeScript, Express, Prisma).
- Frontend: carpeta `frontend` (React + Vite).
- Base de datos: PostgreSQL (configurada en `docker-compose.yml`).

## Requisitos

- Node.js 18+ (solo para desarrollo local)
- Docker & Docker Compose (para ejecutar en contenedor)

## Ejecutar con Docker (recomendado)

1. Construir y levantar servicios:

```bash
docker compose up --build -d
```

2. Ver estado de los servicios:

```bash
docker compose ps
docker compose logs --tail 200 app
```

Notas:
- Las migraciones de Prisma se ejecutan automáticamente al arrancar el contenedor.
- El seeder no se ejecuta automáticamente en producción; para poblar datos de ejemplo:

```bash
docker compose exec app npx ts-node prisma/seed.ts
```

## Desarrollo local (sin Docker)

1. Instalar dependencias (raíz con workspaces):

```bash
npm ci
```

2. Backend en modo desarrollo:

```bash
npm run dev --workspace=backend
```

3. Frontend en modo desarrollo:

```bash
npm run dev --workspace=frontend
```

## Variables de entorno importantes

- `DATABASE_URL` — cadena de conexión a PostgreSQL
- `JWT_SECRET` — clave para firmar tokens
- `PORT` — puerto donde escucha la app (por defecto 3000)

## Estructura principal

- `backend/` — código servidor, Prisma schema, scripts.
- `frontend/` — app React, configuraciones de Vite.
- `docker-compose.yml` — define servicios `db` y `app`.

## ¿Qué sigue?

Si quieres, puedo:
- Añadir instrucciones paso a paso para despliegue en producción.
- Añadir un script para ejecutar el seeder compilado automáticamente.
