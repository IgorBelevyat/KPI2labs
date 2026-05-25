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

# Інструкція з розгортання (CI/CD Pipeline)

Проєкт використовує повністю автоматизований процес неперервної інтеграції та розгортання (CI/CD) на базі GitHub Actions. Замість ручної збірки на сервері, система використовує підхід з попередньою збіркою Docker-образів (у GitHub Container Registry) та їх автоматичним пуллингом на цільовий сервер.

## Архітектура розгортання (Dual-VM)

Для імітації реального корпоративного середовища використовується архітектура з двома віртуальними машинами в локальній мережі:

1. **VM-1 (Target / Production Server)**: Головний сервер, на якому безпосередньо працює додаток (Nginx, Node.js, PostgreSQL, Kafka). Він не витрачає ресурси на компіляцію коду чи збірку Docker-образів.
2. **VM-2 (Self-Hosted Runner)**: Спеціальний допоміжний сервер, на якому встановлено GitHub Actions Runner. Він слугує мостом між хмарою GitHub та локальною мережею.

### Чому два сервери?
Оскільки цільовий сервер знаходиться в локальній мережі без публічної IP-адреси, хмарні сервери GitHub не можуть напряму підключитися до нього по SSH. Тому Runner (VM-2), який знаходиться в тій самій локальній мережі, що й Target, звертається до GitHub за завданнями (Pull), а потім по SSH віддає команди Цільовому серверу (VM-1).

### Початкове налаштування серверів (Один раз)
Для того щоб ця архітектура запрацювала, на обох віртуальних машинах необхідно один раз виконати скрипти ініціалізації та пов'язати їх між собою:
1. **Підготовка машин**:
   - На **VM-1 (Target)**: Виконати скрипт `deploy/setup-target.sh` (встановлює Docker, Docker Compose та готує робочі директорії).
   - На **VM-2 (Runner)**: Виконати скрипт `deploy/setup-runner.sh` (встановлює необхідні залежності).
2. **Налаштування SSH-доступу**: Згенерувати SSH-ключ на Раннері (VM-2) за допомогою `ssh-keygen` та додати публічний ключ у файл `~/.ssh/authorized_keys` на Цільовому сервері (VM-1), щоб Раннер міг виконувати команди без пароля.
3. **Реєстрація Раннера в GitHub**: Зайти в налаштування репозиторію на GitHub (`Settings` -> `Actions` -> `Runners`), натиснути `New self-hosted runner` і скопіювати звідти згенеровані команди для завантаження, конфігурації та запуску `actions-runner` на вашій VM-2.

### Топологія Docker-контейнерів (на VM-1)
Система складається з 5 ізольованих контейнерів, об'єднаних у віртуальну Docker-мережу `ticket_network`:
1. **ticketbooking-nginx** (публічний порт `80`): Віддає статичні файли Frontend (Vite/React) та слугує reverse proxy для всіх API-запитів.
2. **ticketbooking-web** (внутрішній порт `8000`): Node.js Backend. Автоматично застосовує міграції БД та запускає сервер при старті.
3. **ticketbooking-db** (порт `5432`): PostgreSQL база даних зі збереженням даних на локальному диску (Bind Mount у папку `postgres_data`).
4. **ticketbooking-kafka** (порт `9092`): Брокер повідомлень Kafka для асинхронних подій.
5. **ticketbooking-zookeeper** (порт `2181`): Zookeeper для координації Kafka.

## Як працює пайплайн

Розгортання розділено на два етапи (CI та CD).

### 1. Етап CI (Continuous Integration)
Файл: `.github/workflows/ci.yml`

Виконується на **хмарних серверах GitHub (ubuntu-latest)** при кожному пуші в гілки `prod` / `cicd` або при створенні тегу:
- Проганяє всі юніт та інтеграційні тести (Jest).
- Перевіряє код лінтерами (ESLint, Hadolint, Shellcheck).
- Збирає оптимізовані production-образи (Frontend та Backend) за допомогою Multi-Stage Dockerfile.
- Пушить готові образи в **GitHub Container Registry (GHCR)**.

### 2. Етап CD (Continuous Deployment)
Файл: `.github/workflows/deploy.yml`

Запускається **виключно при створенні нового Git-тегу** (наприклад, `v1.0.0`) і виконується на **локальному Runner'і (VM-2)**:
1. **Deploy (`deploy.sh`)**: Runner копіює `docker-compose.yml` на Цільовий сервер (VM-1) по SSH. Потім він віддає Цільовому серверу команду завантажити (`docker-compose pull`) вже готові образи з GHCR і запустити їх (`docker-compose up -d`).
2. **Verify (`verify.sh`)**: Runner виконує "Readiness Probe" — очікує до 60 секунд, роблячи запити до `http://localhost/health/alive` на Цільовому сервері. Якщо бекенд успішно відповідає (HTTP 200) і жоден контейнер не падає, розгортання вважається успішним. У разі помилки — пайплайн падає і виводить логи бекенду.

## Як розгорнути нову версію (Інструкція для розробника)

Вам **не потрібно** заходити на сервери по SSH, щоб оновити сайт. Процес повністю автоматизований.

1. Внесіть зміни у код і зафіксуйте їх (commit).
2. Злийте зміни у гілку `prod` (або ту, яка налаштована як основна).
3. Створіть новий тег і відправте його на GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. Зайдіть у розділ **Actions** на GitHub і спостерігайте. Як тільки обидва пайплайни (CI та Deploy) загоряться зеленим — ваш оновлений код і вже працює на сервері!

## Тестування розгорнутої системи

Після успішного розгортання, відкрийте у браузері IP-адресу вашої Цільової машини (Target VM-1), наприклад: **`http://192.168.1.50/`**

- **Frontend UI**: `http://<TARGET_IP>/`
- **Backend API**: `http://<TARGET_IP>/api/`
- **API Документація**: `http://<TARGET_IP>/api-docs`
- **Перевірка стану (Health)**: `http://<TARGET_IP>/health/alive`
