## 1. Які переваги дало розділення на шари?

### Ізоляція бізнес-логіки

Головна перевага — бізнес-логіка (Domain Layer) повністю ізольована від технічних деталей. Наприклад, `BookingFactory` перевіряє, чи місце вже заброньоване, чи потяг існує, чи дата не в минулому і робить це без жодного знання про Prisma, Express чи HTTP:

```typescript
// domain/factories/booking-factory.ts
const isBooked = await this.bookingRepo.isSeatBooked(seatId, trainId, travelDate);
if (isBooked) throw new ConflictError('This seat is already booked');
```

Фабрика працює з інтерфейсом `BookingRepository`, а не з конкретною реалізацією. Це дозволяє тестувати бізнес-логіку без бази даних, підставивши `InMemoryBookingRepository`.

### Чітке розділення відповідальностей

Кожен шар відповідає за своє:

| Шар | Відповідальність | Приклад |
|-----|-----------------|---------|
| Presentation | Прийом HTTP, валідація формату, серіалізація | `booking-validator.ts` перевіряє, чи `travelDate` — валідна ISO-дата |
| Application | Оркестрація бізнес-операцій | `CreateBookingUseCase` координує: фабрика → репозиторій → DTO |
| Domain | Бізнес-правила та інваріанти | `Booking.cancel()` перевіряє, чи бронювання ще не скасоване |
| Infrastructure | Робота з БД, зовнішні сервіси | `PrismaBookingRepository` виконує SQL через Prisma ORM |

Це означає, що зміна в одному шарі не впливає на інші.

### Незалежність API та домену

DTO розділяють зовнішній контракт (API) і внутрішню структуру (домен). `BookingResultDto` містить денормалізовані дані (`train.number`, `seat.number`) для зручності клієнта, тоді як доменна модель `Booking` зберігає лише `trainId` та `seatId`. Зміна формату API-відповіді не вимагає змін у домені — достатньо змінити DTO та маппінг у Read Repository.

### Локалізація помилок

Доменні помилки (`DomainError`, `ConflictError`, `NotFoundError`) описують бізнес-ситуації мовою домену, а не технічною мовою. Presentation Layer єдиний відповідає за мапінг у HTTP-статуси:

```typescript
// presentation/middleware/error-handler.ts
if (err instanceof ConflictError) {
  res.status(409).json({ error: err.message });
}
```

Якщо потім проєкт перейде з REST на gRPC — бізнес-логіка не зміниться, зміниться лише error handler.

---

## 2. Які недоліки / ускладнення з'явилися?

### Більший обсяг коду

Проста операція «створити бронювання» проходить через 6+ файлів:

```
BookingController → CreateBookingUseCase → BookingFactory → BookingRepository (interface)
                                                             ↓
                                           PrismaBookingRepository (implementation) → BookingMapper
```

Я думаю в моноліті без шарів це був би один файл контролера з прямим зверненням до БД. Шарова архітектура збільшує кількість файлів приблизно в 3–4 рази.

### Накладні витрати на маппінг

Дані конвертуються на кожному кордоні:

1. **HTTP => DTO**: `req.body` => `CreateBookingDto` (Presentation => Application)
2. **DTO => Domain**: Use Case передає дані у Factory, яка створює `Booking` (Application => Domain)
3. **Domain => Persistence**: `BookingMapper.toPersistence(booking)` (Domain => Infrastructure)
4. **Persistence => Domain**: `BookingMapper.toDomain(raw)` (Infrastructure => Domain)
5. **Domain => DTO**: Use Case формує `BookingResultDto` з доменної моделі (Domain => Application)

Кожна конвертація — це код, який потрібно написати, підтримувати та синхронізувати при зміні полів. Наприклад, додавання нового поля до `Booking` потребує змін у моделі, маппері та DTO.

### Складніша навігація

Розробнику потрібно знати архітектуру, щоб зрозуміти, де шукати логіку. Наприклад на питання «Чому не створюється booking?» відповідь може бути у:
1. валідаторі (Presentation) — невалідний формат дати
2. фабриці (Domain) — місце зайняте
3. репозиторії (Infrastructure) — помилка unique constraint

Без знання шарової архітектури навігація між файлами може бути неінтуїтивною.

### Ризик надмірної абстракції

Для простих CRUD-операцій (наприклад, `GetStationsUseCase` — просто повертає `stationRepo.findAll()`) шарова архітектура є overkill. Use Case стає прохідним класом без додаткової цінності:

```typescript
export class GetStationsUseCase {
  async execute() {
    return this.stationRepo.findAll(); 
  }
}
```

---

## 3. Наскільки простіше тепер змінити БД або фреймворк?

### Зміна БД (Prisma/PostgreSQL → MongoDB)

**Що потрібно змінити:**
- Файли в `infrastructure/repositories/` — написати нові реалізації (`MongoBookingRepository`, `MongoTrainRepository`)
- Файли в `infrastructure/mappers/` — адаптувати мапери під нову структуру даних
- `server.ts` — замінити інстанціацію: `new PrismaBookingRepository(prisma)` → `new MongoBookingRepository(mongo)`

**Що не буде змінюватись:**
- Domain Layer (моделі, фабрики, помилки) — 0 змін
- Application Layer (Use Cases, DTO) — 0 змін
- Presentation Layer (контролери, валідатори) — 0 змін
- Frontend — 0 змін

Це можливо завдяки DIP: Use Cases залежать від інтерфейсів (`BookingRepository`), а не від `PrismaBookingRepository`. Інтерфейс визначений у Domain Layer, а реалізація — в Infrastructure:

### Зміна фреймворку (Express → Fastify або gRPC)

**Що потрібно змінити:**
- `presentation/controllers/` — адаптувати під новий формат request/response
- `presentation/middleware/` — переписати error handler, auth middleware
- `presentation/routes/` — новий роутінг
- `server.ts` — ініціалізація нового фреймворку

**Що не змінюється:**
- Domain Layer
- Application Layer (Use Cases не знають про Express)
- Infrastructure repositories/mappers

### Оцінка трудовитрат

| Операція | Без шарів (моноліт) | З шаровою архітектурою |
|----------|---------------------|----------------------|
| Зміна БД | Переписати весь backend | Переписати тільки Infrastructure (~20% коду) |
| Зміна фреймворку | Переписати весь backend | Переписати тільки Presentation (~15% коду) |
| Додати gRPC поряд з REST | Неможливо без рефакторингу | Додати новий Presentation Layer, решта працює |

---

## 4. Чому було обрано Rich Domain Model?

### Контекст вибору

Проєкт має нетривіальну бізнес-логіку з чіткими інваріантами:
- Бронювання можна скасувати, тільки якщо воно ще активне
- Скасувати може лише власник
- Місце не може бути заброньоване двічі на ту саму дату
- Потяг не можна видалити, якщо є активні бронювання
- Маршрут не можна видалити, якщо є прив'язані потяги

Ці правила потребують захисту і Rich Model забезпечує цей захист на рівні моделі.

### Ось приклад коду цього захисту:

```typescript
// domain/models/booking.ts — Rich Model
export class Booking {
  private _status: BookingStatus;    // приватне поле

  get status() { return this._status; }  // тільки читання

  cancel(): void {
    if (this._status === 'cancelled') {
      throw new DomainError('Booking is already cancelled');
    }
    this._status = 'cancelled';  // змінити можна тільки через метод
  }
}
```

Зовнішній код не може написати `booking.status = 'cancelled'` напряму — доступ до поля захищений. Єдиний спосіб змінити статус — викликати `cancel()`, який перевіряє правила.

### Порівняння з Anemic Model

У Anemic Model та сама логіка жила б у зовнішньому сервісі:

```typescript
// Anemic — стан не захищений
class BookingService {
  cancel(booking: Booking) {
    if (booking.status === 'cancelled') throw ...;
    booking.status = 'cancelled';  // прямий доступ!
  }
}
```

**Проблеми Anemic Model для нашого проєкту:**
1. Інваріанти не захищені — будь-який код може написати `booking.status = 'cancelled'` в обхід перевірок
2. Дублювання — якщо два Use Cases скасовують бронювання, правила перевірки доведеться дублювати в обох
3. Розмазана логіка — щоб зрозуміти всі правила `Booking`, потрібно шукати по всіх сервісах, а не в одному класі

### Де Rich Model особливо корисна в нашому проєкті

| Модель | Поведінка | Інваріант |
|--------|-----------|-----------|
| `Booking` | `cancel()` | Не можна скасувати вже скасоване бронювання |
| `BookingFactory` | `create()` | Місце не зайняте, потяг існує, дата валідна |
| `DeleteRouteUseCase` | перед `delete()` | Маршрут не використовується потягами |
| `DeleteTrainUseCase` | перед `delete()` | Немає активних бронювань |

### Коли Anemic Model можливо була б кращою

Для простіших частин системи (наприклад: `Station` — просто `id` + `name`, без складної поведінки) Rich Model не дає значної переваги. Але оскільки всі моделі в проєкті слідують єдиному стилю, ми зберігаємо консистентність архітектури.