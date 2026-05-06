# Порівняльний аналіз: CQS vs Use-Case (Лабораторна 3 vs Лабораторна 2)

## 1. Що змінилося в структурі проєкту порівняно з лабораторною 2?

У лабораторній 2 Application Layer містив єдину папку `use-cases/`, де кожен клас (наприклад, `CreateStationUseCase`) інкапсулював і зміну стану, і читання даних. Всі Use Case повертали повні DTO з усіма полями об'єкта.

У лабораторній 3 цей шар розділено на дві окремі гілки:

```
application/
├── commands/          ← операції запису (15 команд)
│   ├── auth/          register, login, refresh
│   ├── stations/      create, update, delete
│   ├── routes/        create, update, delete
│   ├── trains/        create, update, delete, add-carriage
│   └── bookings/      create, cancel
├── queries/           ← операції читання (6 запитів)
│   ├── stations/      get-stations + StationReadModel
│   ├── routes/        get-routes + RouteReadModel
│   ├── trains/        get-all, search, get-seats + TrainReadModel
│   └── bookings/      get-user-bookings + BookingReadModel
└── interfaces/        ← Read Repository інтерфейси
    ├── station-read-repository.ts
    ├── route-read-repository.ts
    ├── train-read-repository.ts
    └── booking-read-repository.ts
```

Кожна команда складається з двох файлів: `.command.ts` (DTO з полями) і `.handler.ts` (логіка). Кожен запит — з `.query.ts` (параметри), `.handler.ts` (обробник) і `.read-model.ts` (модель відповіді). На інфраструктурному рівні з'явилися окремі Read Repository реалізації (`PrismaStationReadRepository`, `PrismaRouteReadRepository`, `PrismaTrainReadRepository`), які читають дані напряму з бази без маппінгу через доменні моделі.

Контролери стали тонкими — замість 3–5 UseCase-залежностей вони приймають набір окремих Command та Query Handler'ів і лише мапплять HTTP-запити на відповідні об'єкти.

## 2. Переваги CQS: чим допомогло розділення?

**Чіткий контракт між шарами.** Command і Query — це іменовані інтерфейси, які явно описують, що потрібно для операції. Наприклад, `CancelBookingCommand { bookingId, userId }` — неможливо переплутати порядок аргументів, на відміну від `cancelUC.execute(id, userId)`.

**Незалежна оптимізація читання.** Query Handler'и використовують Read Repository, який звертається до Prisma з `include` (JOIN) і повертає готовий ReadModel. Це дозволяє оптимізувати запити під потреби UI без впливу на доменну логіку. Наприклад, `RouteReadModel` містить денормалізоване поле `stationName`, яке формується одним SQL-запитом з JOIN, тоді як доменна модель `Route` зберігає лише `stationId`.

**Захист від витоку даних.** ReadModel явно визначає, які поля повертаються клієнту. Неможливо випадково віддати зайві або внутрішні поля (password hash, internal flags).

**Спрощення тестування.** Command Handler'и тестуються на коректність бізнес-логіки, а Query Handler'и — на правильність формування відповіді. Ці тести незалежні один від одного.

## 3. Недоліки CQS: що ускладнилося?

**Збільшення кількості файлів.** Замість 21 файлу в `use-cases/` з'явилося приблизно 40 файлів у `commands/` та `queries/` (command + handler для кожної операції, query + handler + read-model для кожного запиту). Для невеликого проєкту це може виглядати надмірним.

**Дублювання DI-конфігурації.** `server.ts` тепер містить створення та ін'єкцію як Command Handler'ів, так і Query Handler'ів, а також окремих Read Repository. Конструктори контролерів стали довшими (TrainController приймає 7 залежностей замість 5).

**Необхідність підтримувати два набори Repository.** Доменний `StationRepository` (для запису) і `StationReadRepository` (для читання) — це два інтерфейси та дві реалізації для однієї й тієї ж таблиці. При зміні схеми БД потрібно оновити обидва.

**Складність для простих операцій.** Для тривіальної операції типу `DeleteStation` створюється три файли (command, handler, і контролерний маппінг), хоча логіка займає 5 рядків.

## 4. Чим підхід з Command/Query Handler відрізняється від Service, який робить все сам?

У підході з Use-Case (Service) один клас відповідає за повний цикл операції: приймає дані, виконує бізнес-логіку, звертається до Repository, формує і повертає DTO. Наприклад, `CreateStationUseCase.execute(dto)` створює станцію і повертає `StationResultDto` з усіма полями.

У CQS-підході операція розділена на дві частини:

- **Command Handler** приймає Command-об'єкт (лише вхідні дані), виконує зміну стану через доменний Repository і повертає мінімум — `{ id }` або `void`. Він не повертає дані для відображення.
- **Query Handler** приймає Query-об'єкт (параметри пошуку), звертається до Read Repository (який обходить доменний шар) і повертає ReadModel — оптимізовану структуру для клієнта.

Ключова відмінність: Service поєднує запис і читання в одному методі, а CQS розділяє їх на незалежні шляхи виконання. Command проходить через Domain (Factory → Entity → Repository), а Query обходить Domain і йде напряму до бази через ReadRepository.

```
Service:    Controller => UseCase => [Domain + Repository] => DTO => Client
Command:    Controller => Handler => Factory => Domain => Repository => { id }
Query:      Controller => Handler => ReadRepository => ReadModel => Client
```

## 5. Як CQS впливає на розширюваність?

**Додавання нової операції запису** — створюється нова пара файлів (`.command.ts` + `.handler.ts`) без жодного впливу на існуючі обробники. Наприклад, додавання `UpdateBookingStatusCommand` не вимагає зміни `CreateBookingCommandHandler` чи `CancelBookingCommandHandler`. У підході з Service довелося б або додати метод у існуючий сервіс (збільшуючи його), або створити новий сервіс з дублюванням залежностей.

**Додавання нового запиту** — створюється `.query.ts`, `.handler.ts`, `.read-model.ts` і, за потреби, новий метод у Read Repository. Це не впливає на жоден Command Handler. Наприклад, додавання `GetTrainScheduleQuery` не зачіпає жодну команду створення чи оновлення поїздів.

**Зміна формату відповіді** — змінюється лише ReadModel і Read Repository, без впливу на доменну модель чи команди. У Service-підході зміна DTO могла б зламати і операцію запису, і операцію читання, якщо вони ділили один DTO.

**Принцип Open/Closed** — замість модифікації існуючого коду (Service), ми розширюємо систему додаванням нових класів. Кожен Handler — це ізольована одиниця з однією відповідальністю (Single Responsibility Principle).

## 6. Чи відрізняється структура даних, яку повертає Query, від доменної моделі? Чому це важливо?

Так, вони принципово відрізняються.

**Доменна модель** представляє бізнес-об'єкт з інваріантами, Value Objects і поведінкою. Наприклад, `Train` містить `TrainNumber` (Value Object), `TimeRange` (Value Object), масив `Carriage` з вкладеними `Seat`. Ці типи призначені для захисту бізнес-правил, а не для відображення.

**ReadModel** — це плоска структура даних, оптимізована для клієнта:

```typescript
// Доменна модель — багатошарова, з Value Objects
class Train {
  number: TrainNumber;          // Value Object з валідацією
  schedule: TimeRange;          // Value Object
  carriages: Carriage[];        // Вкладений агрегат
}

// ReadModel — плоска, з примітивами
interface TrainReadModel {
  id: string;
  number: string;               // Просто рядок
  departureTime: string;        // ISO string, не Date
  arrivalTime: string;
  carriages: CarriageReadModel[];  // Спрощена структура
}
```

**Чому це важливо:**

1. **Незалежність еволюції.** Домен може змінюватися (додаються нові Value Objects, методи), а API для клієнта залишається стабільним — ReadModel є буфером між ними.

2. **Денормалізація.** ReadModel може містити дані з кількох таблиць. Наприклад, `RouteReadModel` включає `stationName` з таблиці stations, тоді як доменна модель `Route` зберігає лише `stationId`. Це зменшує кількість запитів клієнта.

3. **Безпека.** Доменна модель `User` містить `passwordHash`, але `BookingReadModel` ніколи не включає цю інформацію, оскільки ReadModel явно описує лише потрібні поля.

4. **Продуктивність.** Read Repository формує ReadModel одним SQL-запитом з JOIN, обходячи створення доменних об'єктів, маппінг Value Objects і повторні запити до БД. Це особливо важливо для списків і пошукових запитів.
