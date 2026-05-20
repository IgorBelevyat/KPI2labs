# TicketBooking — система бронювання залізничних квитків

Система бронювання квитків на потяги, побудована на основі **Modular Monolith** (DDD) з використанням Event-Driven Architecture, CQRS та Eventual Consistency.

## Технології
| Технологія  | Реалізація |
|--------------|---------------- |
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TypeScript |
| БД | PostgreSQL |
| ORM | Prisma |
| Брокер повідомлень | Kafka (`kafkajs`) |
| Авторизація | JWT (access + refresh tokens) |
| Хешування | bcrypt |

## Архітектура (Modular Monolith)

Проєкт розділено на три суворо ізольовані бізнес-модулі. Кожен модуль має класичні шари DDD (Domain, Application, Infrastructure, Presentation).

```
src/
├── modules/
│   ├── catalog/       # Управління станціями, маршрутами та потягами (Адмінка)
│   ├── booking/       # Реєстрація користувачів та управління їхніми бронюваннями
│   └── analytics/     # Асинхронний збір статистики продажів квитків
├── shared/            # Загальна інфраструктура (Event Bus, Middlewares, Auth)
└── server.ts          # Composition Root (Dependency Injection)

frontend/
├── src/
│   ├── pages/         # Сторінки React (Home, TrainBooking, MyBookings, Admin)
│   └── ...
```

**Особливості архітектури:**
- **Модульна ізоляція**: Модуль Booking не має прямого доступу до бази даних Catalog, а використовує синхронний `CatalogFacade`.
- **Event-Driven Architecture**: Модуль Analytics взагалі не зв'язаний з Booking. Він отримує дані асинхронно через підписку на події Kafka (`BookingCreated`, `BookingCancelled`).
- **CQRS**: Розділені моделі та репозиторії для запису (Write/Domain Repositories) та читання (Read Repositories).

---

## Налаштування середовища розробки

### Передумови

| Програма | Версія | Перевірка |
|----------|--------|-----------|
| Node.js | v18+ (рекомендовано v20 LTS) | `node -v` |
| npm | v9+ | `npm -v` |
| Docker | Останній | `docker -v` |

### 1. Клонування та залежності

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
npm install

cd frontend
npm install
cd ..
```

### 2. Налаштування `.env`

Створіть файл `.env` у кореневій директорії:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticket_booking?schema=public"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Режим роботи подій: 'sync' (без Кафки) або 'async' (через Кафку)
NOTIFICATION_MODE="async" 
KAFKA_BROKER="localhost:9092"
PORT=8000
```

### 3. Запуск інфраструктури (Kafka + Zookeeper)

Оскільки використовується асинхронна аналітика, потрібна Kafka:
```bash
docker-compose up -d zookeeper kafka
```
*(Для PostgreSQL ви можете використовувати локально встановлений сервер або додати його в Docker)*

### 4. Підготовка БД

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 5. Запуск застосунку (dev-режим)

**Термінал 1 — Backend (порт 8000):**
```bash
npm run dev
```

**Термінал 2 — Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

---

## API Endpoints

### Авторизація
- `POST /api/auth/register` — Реєстрація
- `POST /api/auth/login` — Вхід
- `POST /api/auth/refresh` — Оновлення токена

### Адміністративна панель (Catalog)
- `GET/POST/PUT/DELETE /api/stations` — Управління станціями
- `GET/POST/PUT/DELETE /api/routes` — Управління маршрутами
- `GET/POST/PUT/DELETE /api/trains` — Управління потягами
- `POST /api/trains/:id/carriages` — Додавання вагонів

### Бронювання квитків (Booking)
- `GET /api/trains/search` — Пошук потягів за маршрутом та датою
- `GET /api/trains/:id/seats` — Перегляд доступних місць у потязі
- `GET /api/bookings` — Перегляд власних бронювань
- `POST /api/bookings` — Створення бронювання (публікує подію в Kafka)
- `PATCH /api/bookings/:id/cancel` — Скасування бронювання

### Аналітика (Analytics)
- `GET /api/analytics` — Отримання статистики проданих квитків та доходу (дані оновлюються асинхронно через Kafka)

---

## Тестування

Система покрита модульними та інтеграційними тестами (загалом **112 тестів**).

```bash
# Всі тести
npm test

# Тільки unit-тести (без БД)
npm run test:unit

# Інтеграційні тести (потребують БД)
npm run test:integration

# Перевірка компіляції TypeScript
npx tsc --noEmit
```

Для перегляду даних бази можна використовувати вбудовану утиліту:
```bash
npm run prisma:studio
```

---

# Інструкція з розгортання (Docker Compose)

Система повністю контейнеризована і розгортається за допомогою Docker Compose. Вся інфраструктура піднімається однією командою.

## Передумови

На сервері або локальній машині мають бути встановлені:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Архітектура розгортання

Система складається з 5 ізольованих контейнерів, об'єднаних у віртуальну мережу `ticket_network`:
1. **ticketbooking-nginx** (порт `80`): Віддає статичні файли Frontend (Vite/React) та слугує reverse proxy для API.
2. **ticketbooking-web** (внутрішній порт `8000`): Node.js Backend. Автоматично застосовує міграції та виконує заповнення бази (seeding) при старті.
3. **ticketbooking-db** (порт `5432`): PostgreSQL база даних зі збереженням даних на локальному диску (у локальній папці `postgres_data`).
4. **ticketbooking-kafka** (порт `9092`): Брокер повідомлень Kafka для асинхронних подій.
5. **ticketbooking-zookeeper** (порт `2181`): Zookeeper для координації Kafka.

## Кроки для розгортання

### 1. Клонування репозиторію

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
```

### 2. Запуск контейнерів

Щоб зібрати образи та запустити систему у фоновому режимі, виконайте:

```bash
docker-compose up -d --build
```

Docker Compose автоматично:
- Завантажить необхідні базові образи (Postgres, Kafka, Nginx, Node).
- Збере оптимізовані production-образи для Frontend та Backend (з використанням multi-stage builds).
- Створить базу даних і виконає міграції.
- Запустить усі сервіси.

### 3. Перевірка статусу

Переконайтеся, що всі сервіси працюють:

```bash
docker-compose ps
```

Для перегляду логів певного сервісу (наприклад, бекенду):
```bash
docker-compose logs -f web
```

## Тестування розгорнутої системи

Після успішного розгортання система буде доступна за наступними адресами:

### 1. Інтерфейс користувача (Frontend)
Відкрийте у браузері: **[http://localhost/](http://localhost/)**

### 2. Backend API
Всі API-запити проксіюються Nginx за префіксом `/api/`:
- `http://localhost/api/stations`
- `http://localhost/api/trains`

### 3. API Документація
Сторінка з описом усіх доступних ендпоінтів: **[http://localhost/api-docs](http://localhost/api-docs)**

### 4. Health Checks
Перевірка життєздатності сервера:
- `http://localhost/health/alive`
- `http://localhost/health/ready` (перевіряє підключення до БД)

## Управління даними та зупинка

Дані бази даних безпечно зберігаються на жорсткому диску у локальній папці `postgres_data` (Bind Mount). Навіть якщо буде повністю видалено Docker, дані бази не зникнуть.

- **Зупинити сервіси** (дані зберігаються):
  ```bash
  docker-compose stop
  ```
- **Видалити контейнери** (дані БД зберігаються):
  ```bash
  docker-compose down
  ```
- **ПОВНЕ видалення бази даних** (ОБЕРЕЖНО!):
  Оскільки ми використовуємо локальну папку (Bind Mount), команда Docker її не видалить. Щоб повністю обнулити базу даних, вам потрібно зупинити контейнери і видалити папку вручну:
  ```bash
  docker-compose down
  # Після цього видаліть папку postgres_data через провідник або командою:
  rm -rf postgres_data
  ```
