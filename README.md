# UzMedAtlas

Медицинский каталог: **Vite + React** (`client`) и **Fastify + Prisma** (`server`).

Пакеты независимы — у каждого свой `package.json`, lockfile и `node_modules`.

```text
UzMedAtlas/
├── client/   # SPA (Vite, React, TanStack Router, React Query, Tailwind)
├── server/   # API (Fastify, Prisma, SQLite)
└── docs/     # ТЗ, референсы Medion
```

## Быстрый старт

```bash
# API
cd server
cp .env.example .env
npm install
npm run setup          # prisma generate + db push + seed
npm run dev            # http://localhost:4000

# SPA (другой терминал)
cd client
cp .env.example .env   # если ещё нет
npm install
npm run dev            # http://localhost:5173
```

## API (черновик)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/health` | healthcheck |
| GET | `/api/clinics` | каталог (`q`, `city`, `specialty`, `lang`, `sort`) |
| GET | `/api/clinics/:slug` | страница клиники |
| GET | `/api/specialties` | направления |
| POST | `/api/checker/analyze` | Health Checker |
| POST | `/api/admin/login` | админ-логин |
| GET | `/api/admin/me` | сессия админа |

## Дизайн

- Layout/UI — по референсам Medion (`docs/medion-reference/`)
- Цвета — токены synapse-animals (`#1570ef` primary)
- Функционал — `docs/AMO.MD`
