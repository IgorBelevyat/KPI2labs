# TicketBooking — система бронювання залізничних квитків

Система бронювання квитків на потяги, побудована на основі Layered Architecture (DDD) з Rich Domain Model.

## Технології
| Technologie  | Implementation |
|--------------|---------------- |
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

---

# Інструкція з розгортання

## Варіант індивідуального завдання

**Номер у списку:** N = 3

V2 = 2 - Спосіб конфігурації:Конфігураційний файл за шляхом /etc/mywebapp/config.extension
V3 = свій проєкт
V5 = 4 - Порт застосунку 8000


**Порт застосунку:** `8000`
**Порт бази даних:** `5432`
**Порт Frontend:** `5173`
**Порт Nginx (зворотний проксі):** `80`

---

## Налаштування середовища розробки

### Передумови

| Програма | Версія | Перевірка |
|----------|--------|-----------|
| Node.js | v18+ (рекомендовано v20 LTS) | `node -v` |
| npm | v9+ | `npm -v` |
| PostgreSQL | v14+ | `psql --version` |
| Git | будь-яка | `git --version` |

### Крок 1 — Клонування та залежності

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
npm install

cd frontend
npm install
cd ..
```

### Крок 2 — Налаштування `.env`

Створіть файл `.env` у кореневій директорії:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ticket_booking?schema=public"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=8000
NODE_ENV=development
```

### Крок 3 — Підготовка БД

```bash
psql -U postgres -c "CREATE DATABASE ticket_booking;"
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### Запуск застосунку (dev-режим)

**Термінал 1 — Backend (порт 8000):**
```bash
npm run dev
```

**Термінал 2 — Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

Після запуску:
- Backend API: http://localhost:8000/api
- Frontend UI: http://localhost:5173

---

## Розгортання на віртуальній машині

### Базовий образ ВМ

| Параметр | Значення |
|----------|----------|
| **ОС** | Ubuntu 22.04 LTS (Jammy Jellyfish) |
| **Джерело** | [ubuntu.com/download/server](https://ubuntu.com/download/server) або [releases.ubuntu.com/22.04](https://releases.ubuntu.com/22.04/) |
| **Тип образу** | ISO — `ubuntu-22.04.X-live-server-amd64.iso` |

### Вимоги до ресурсів ВМ

| Ресурс | Мінімум |
|--------|---------|
| CPU | 2 ядра |
| RAM | 2 ГБ |
| Диск | 40 ГБ |
| Мережа | NAT або Bridged Adapter |

### Доступ до ВМ
Консоль: через VirtualBox/VMware — основний спосіб 


**Credentials після розгортання:**

| Користувач | Пароль | Роль |
|------------|--------|------|
| `student` | `12345678` (зміна при першому вході) | Основний, sudo |
| `teacher` | `12345678` (зміна при першому вході) | Викладач, sudo |
| `operator` | `12345678` (зміна при першому вході) | Тільки управління сервісом |
| `app` | — (nologin) | Системний, запускає додаток |

При першому вході через консоль (Ctrl+Alt+F3) система змусить змінити пароль.

### Автоматизоване розгортання

#### 1. Встановити ОС та увійти в консоль

Після інсталяції Ubuntu Server залогінтесь під дефолтним користувачем.

#### 2. Встановити Git та клонувати репозиторій

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone https://github.com/IgorBelevyat/KPI2labs.git /opt/mywebapp
```

#### 3. Запустити скрипт автоматизації

```bash
sudo bash /opt/mywebapp/deploy/setup.sh
```

Скрипт автоматично виконає **8 етапів**:

| Етап | Що робить |
|------|-----------|
| 1/8 | Встановлює пакети: PostgreSQL, Nginx, Node.js 20 LTS |
| 2/8 | Створює користувачів: student, teacher, app, operator |
| 3/8 | Створює базу даних `ticket_booking` та роль `mywebapp` |
| 4/8 | Копіює конфігурації в `/etc/mywebapp/` |
| 5/8 | Встановлює залежності, збирає проєкт, запускає міграції |
| 6/8 | Налаштовує systemd-сервіс `mywebapp` |
| 7/8 | Налаштовує Nginx як зворотний проксі (порт 80 → 8000) |
| 8/8 | Створює файл gradebook, блокує дефолтного користувача |

Після завершення побачите: `Deployment complete!`

### Структура файлів на ВМ після розгортання

```
/opt/mywebapp/                        # Код додатку
├── dist/server.js                    # Зібраний JavaScript
├── prisma/                           # Схема та міграції БД
├── node_modules/                     # Залежності
└── deploy/                           # Конфіги розгортання
    ├── setup.sh                      # Скрипт автоматизації
    ├── nginx.conf                    # Конфігурація Nginx
    ├── mywebapp.service              # Systemd юніт
    └── config.json                   # Конфіг додатку

/etc/mywebapp/                        # Продакшн-конфіги
├── config.json                       # JSON-конфігурація
└── env                               # Змінні середовища для systemd

/etc/systemd/system/mywebapp.service  # Сервіс-файл
/etc/nginx/sites-enabled/mywebapp     # Активний конфіг Nginx
```

### Конфігураційні файли

#### `deploy/nginx.conf` — зворотний проксі

Nginx слухає порт 80 і перенаправляє запити на Node.js (порт 8000):

| Location | Що робить |
|----------|-----------|
| `= /` | Головна сторінка (точний збіг) |
| `/api/` | Усі API-ендпоінти |
| `/health/` | Health-check ендпоінти |
| `/` (fallback) | Все інше → 404 (блокування) |

#### `deploy/mywebapp.service` — systemd-сервіс

- Запускається від користувача `app`
- Перед стартом виконує міграції БД (`ExecStartPre`)
- Автоматично перезапускається при падінні (`Restart=on-failure`)
- Стартує автоматично при завантаженні ОС (`WantedBy=multi-user.target`)

#### Управління сервісом

```bash
sudo systemctl start mywebapp
sudo systemctl stop mywebapp
sudo systemctl restart mywebapp
sudo systemctl status mywebapp
journalctl -u mywebapp -f
```

---

## Тестування розгорнутої системи

### 1. Перевірка health-ендпоінтів

```bash
curl http://localhost/health/alive
# Очікувано: OK

curl http://localhost/health/ready
# Очікувано: OK
```

### 2. Перевірка головної сторінки

```bash
curl http://localhost/
# Очікувано: HTML-сторінка зі списком усіх ендпоінтів
```

### 3. Перевірка API

```bash
curl http://localhost/api/stations
# Очікувано: JSON масив

curl http://localhost/api/trains
# Очікувано: JSON масив
```

### 4. Перевірка безпеки Nginx

```bash
# Невідомий шлях
curl http://localhost/secret
# Очікувано: 404 Not Found

# Прямий доступ до порту 8000 ззовні — заблоковано
# (додаток слухає тільки 127.0.0.1)
```

### 5. Перевірка сервісів

```bash
# Статус додатку
sudo systemctl status mywebapp
# Очікувано: active (running)

# Статус Nginx
sudo systemctl status nginx
# Очікувано: active (running)

# Статус PostgreSQL
sudo systemctl status postgresql
# Очікувано: active (running)
```

### 6. Перевірка користувачів

```bash
# Переключення на оператора
su - operator
sudo systemctl status mywebapp    # Має працювати без пароля
sudo apt-get update               # Має бути ЗАБОРОНЕНО
```
