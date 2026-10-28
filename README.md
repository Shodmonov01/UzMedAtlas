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

Health Checker uses an OpenAI-compatible chat completion endpoint when `OPENAI_API_KEY` is set in `server/.env`. `OPENAI_MODEL` and `OPENAI_BASE_URL` can select a different model or compatible provider. Without a key, it uses the local symptom-to-specialty fallback.

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
- Вариант по присланному референсу с палитрой Solid.svg: основной `#1a526b`, синие `#005881`, `#0187c5`, `#55b6e3`, зелёные `#57bf8c`, `#369265`, `#327755`. Светлые подложки — оттенки этой палитры. Главная открывается рисунком Бухары: при прокрутке эскиз превращается в белый макет, затем в цветное фото (`client/src/widgets/hero-build/HeroBuild.tsx`). Появление секций при прокрутке, плавное движение фона и отклик элементов отключаются при `prefers-reduced-motion`. Токены — `client/src/app/styles/globals.css`, источник фото — `client/public/images/README.md`.
- Функционал — `docs/AMO.MD`

## Рабочий сайт и деплой

Рабочий сайт: https://uzmedguide.uz. Публикуется ветка `main`: сервер проверяет
новые коммиты каждую минуту, выполняет тесты и сборку, сохраняет резервную копию
базы и обновляет сайт. При неудачной проверке после запуска возвращается предыдущая
версия. Секреты, база и загруженные фотографии хранятся отдельно от релизов.

Старая версия до обновления дизайна сохранена в ветке
`codex/legacy-v1-before-redesign`. Инструкция и команды обслуживания:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Изменения схемы базы требуют отдельной
проверенной миграции; автоматический деплой базу не пересоздаёт.
