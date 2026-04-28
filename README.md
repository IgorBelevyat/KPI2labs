# TicketBooking — система бронювання залізничних квитків

Система бронювання квитків на потяги, побудована на основі Layered Architecture (DDD) з Rich Domain Model.

## Технології

| Компонент | Технологія |
|-----------|-----------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TypeScript |
| БД | PostgreSQL |
| ORM | Prisma |
| Авторизація | JWT (access + refresh tokens) |
| Хешування | bcrypt |

## Передумови

Перед запуском переконайтеся, що встановлено:

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+
- npm (встановлюється разом з Node.js)

## Інструкція з запуску

### 1. Клонування репозиторію

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
```

### 2. Налаштування змінних середовища

Створіть файл `.env` у кореневій директорії:

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ticket_booking?schema=public"

# JWT
JWT_ACCESS_SECRET="your-access-secret-change-me"
JWT_REFRESH_SECRET="your-refresh-secret-change-me"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
```

Замініть `YOUR_PASSWORD` на пароль вашого PostgreSQL користувача.

### 3. Створення бази даних

Створіть базу даних `ticket_booking` у PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE ticket_booking;"
```

### 4. Встановлення залежностей та запуск міграцій

```bash
# Backend залежності
npm install

# Генерація Prisma клієнта та застосування міграцій
npx prisma generate
npx prisma migrate dev

# Frontend залежності
cd frontend
npm install
cd ..
```

### 5. Запуск проєкту (dev-режим)

Потрібно запустити два процеси — backend і frontend:

**Термінал 1 — Backend (порт 3000):**
```bash
npm run dev
```

**Термінал 2 — Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

Після запуску:
- Backend API: http://localhost:3000/api
- Frontend UI: http://localhost:5173

### 6. (Опціонально) Seed — тестові дані

```bash
npm run prisma:seed
```

## Доступні скрипти

### Backend

| Команда | Опис |
|---------|------|
| `npm run dev` | Запуск з авто-перезапуском (ts-node-dev) |
| `npm run build` | Компіляція TypeScript у JavaScript |
| `npm start` | Запуск скомпільованого сервера |
| `npm test` | Запуск усіх тестів |
| `npm run test:unit` | Тільки unit-тести |
| `npm run test:integration` | Тільки інтеграційні тести |
| `npm run test:coverage` | Тести з покриттям коду |
| `npm run prisma:generate` | Генерація Prisma клієнта |
| `npm run prisma:migrate` | Застосування міграцій |
| `npm run prisma:seed` | Заповнення БД тестовими даними |
| `npm run prisma:studio` | Prisma Studio (веб-інтерфейс для БД) |

### Frontend

| Команда | Опис |
|---------|------|
| `npm run dev` | Запуск Vite dev-сервера |
| `npm run build` | Production збірка |
| `npm run preview` | Перегляд production збірки |

## Тестування

### Запуск тестів

```bash
# Всі тести
npm test

# Тільки unit-тести (без БД)
npm run test:unit

# Інтеграційні тести (потребують БД)
npm run test:integration

# З покриттям
npm run test:coverage
```

### Ручне тестування (E2E сценарій)

Повний цикл для перевірки системи:

**1. Реєстрація та авторизація**
```bash
# Реєстрація
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Зберегти accessToken з відповіді
```

**2. Створення станцій (потрібні права адміна)**
```bash
curl -X POST http://localhost:3000/api/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"name":"Київ-Пасажирський","city":"Київ"}'

curl -X POST http://localhost:3000/api/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"name":"Львів","city":"Львів"}'
```

**3. Створення маршруту**
```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"stops":[{"stationId":"STATION_1_ID","orderIndex":0},{"stationId":"STATION_2_ID","orderIndex":1}]}'
```

**4. Створення потяга**
```bash
curl -X POST http://localhost:3000/api/trains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"number":"712К","routeId":"ROUTE_ID","departureTime":"2026-05-01T06:00:00Z","arrivalTime":"2026-05-01T12:00:00Z"}'
```

**5. Додавання вагону**
```bash
curl -X POST http://localhost:3000/api/trains/TRAIN_ID/carriages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"number":1,"type":"coupe","seatCount":36}'
```

**6. Пошук потягів**
```bash
curl "http://localhost:3000/api/trains/search?origin=STATION_1_ID&destination=STATION_2_ID&date=2026-05-01"
```

**7. Перегляд місць**
```bash
curl http://localhost:3000/api/trains/TRAIN_ID/seats
```

**8. Бронювання місця**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"trainId":"TRAIN_ID","seatId":"SEAT_ID","travelDate":"2026-05-01"}'
```

**9. Перегляд моїх бронювань**
```bash
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**10. Скасування бронювання**
```bash
curl -X PATCH http://localhost:3000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Перевірка через Prisma Studio

```bash
npm run prisma:studio
```

Відкриється веб-інтерфейс на http://localhost:5555, де можна переглянути та редагувати дані в усіх таблицях.

## API Endpoints

### Авторизація

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід |
| POST | `/api/auth/refresh` | Оновлення токена |

### Станції (admin)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/stations` | Список станцій |
| POST | `/api/stations` | Створити станцію |
| PUT | `/api/stations/:id` | Оновити станцію |
| DELETE | `/api/stations/:id` | Видалити станцію |

### Маршрути (admin)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/routes` | Список маршрутів |
| POST | `/api/routes` | Створити маршрут |
| PUT | `/api/routes/:id` | Оновити маршрут |
| DELETE | `/api/routes/:id` | Видалити маршрут |

### Потяги

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/trains` | Список усіх потягів |
| GET | `/api/trains/search` | Пошук потягів (query: origin, destination, date) |
| POST | `/api/trains` | Створити потяг (admin) |
| PUT | `/api/trains/:id` | Оновити потяг (admin) |
| DELETE | `/api/trains/:id` | Видалити потяг (admin) |
| POST | `/api/trains/:id/carriages` | Додати вагон (admin) |
| GET | `/api/trains/:id/seats` | Переглянути місця |

### Бронювання

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/bookings` | Мої бронювання |
| POST | `/api/bookings` | Забронювати місце |
| PATCH | `/api/bookings/:id/cancel` | Скасувати бронювання |

## Структура проєкту

```
src/
├── domain/            # Бізнес-логіка (моделі, фабрики, інтерфейси репозиторіїв, помилки)
├── application/       # Оркестрація (Use Cases, DTO, інтерфейси для читання)
├── presentation/      # HTTP-шар (контролери, валідатори, middleware, роутінг)
└── infrastructure/    # Технічна реалізація (Prisma репозиторії, маперів, auth)

frontend/
├── src/
│   ├── pages/         # Сторінки (Home, TrainBooking, MyBookings, Admin)
│   ├── components/    # Спільні компоненти (Button, Input, ErrorMessage)
│   ├── context/       # AuthContext
│   ├── services/      # API client (axios)
│   └── types/         # TypeScript типи
```

Детальний опис архітектури — у файлі `docs/analysis/lab2.md`.
