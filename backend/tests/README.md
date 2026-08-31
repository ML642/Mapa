# Тесты (Vitest)

Юнит- и интеграционные тесты бэкенда. Раннер — **Vitest 4**, БД для интеграции — **mongodb-memory-server**.

## Команды

```bash
npm test               # прогнать всё (unit + integration)
npm run test:unit      # только unit  (tests/unit/**)
npm run test:integration  # только integration (tests/integration/**)
npm run test:watch     # watch-режим
npm run test:coverage  # с отчётом покрытия (v8)
```

## Структура

```
tests/
  setup/
    env.ts           # process.env до импортов (JWT-секреты и т.п.)
    node-runtime.ts  # ts-node + заглушки import-side-effects (см. ниже)
  helpers/
    nodeRequire.ts   # appRequire — грузит модули приложения как в проде
    app.ts           # экспорт Express-app для supertest
    db.ts            # connect/clear/close in-memory Mongo (per-suite)
    auth.ts          # createVerifiedUser(role) + подпись JWT
  factories/         # каноничные билдеры документов (User, Event, ...)
  unit/<домен>/      # unit-тесты
  integration/<домен>/ # интеграционные тесты
```

## ⚠️ Как устроен импорт кода приложения (обязательно к прочтению)

Кодовая база смешанная: **CommonJS (.js) + TypeScript (.ts)**, и .js-контроллеры делают
extensionless `require(".../someService")` → `.ts`. В рантайме это работает через ts-node
(`nodemon: node -r ts-node/register`). Vitest сам так не умеет: импортируя CJS-граф, он отдаёт его
нативному загрузчику Node, до которого не достаёт ни Vite-резолвер, ни `vi.mock`, а Node без ts-node
не резолвит `.ts`.

Поэтому граф приложения грузится **через Node + ts-node** (`tests/setup/node-runtime.ts`), а в тестах
модули приложения берутся через **`appRequire`**:

```ts
import { appRequire } from "../helpers/nodeRequire";

const User = appRequire("./models/User");           // модель приложения (тот же инстанс, что в app)
const { AuthService } = appRequire("./services/authService");
const mongoose = appRequire("mongoose");            // общий с приложением node_module
```

**Правило:** любой модуль приложения (`app`, `models`, `services`, `controllers`, `middlewares`) и
общие node_modules, которые делит приложение (`mongoose`, `jsonwebtoken`, `fs`), берите через
`appRequire` — тогда тест видит РОВНО ТЕ ЖЕ инстансы (сиды в БД и шпионы на сервисы работают).
Исключение: **чисто-логические** модули без зависимостей от моделей/БД можно импортировать обычным
`import` (так сделаны `tests/unit/events/*`).

### Заглушки import-side-effects

`tests/setup/node-runtime.ts` кладёт в `require.cache` заглушки (до загрузки app), гасящие внешние
эффекты при импорте: **node-cron** (таймеры), **config/redis** (жадный коннект), **createLogger**
(fs + файловый лог), **emailService** (SMTP). Все заглушки — `vi.fn()`, поэтому в тесте можно
проверять вызовы:

```ts
const email = appRequire("./services/emailService");
expect(email.sendVerificationEmail).toHaveBeenCalledWith("user@example.com", expect.any(Number));
```

Нужен ещё внешний мок (axios/imageService/parserQueue) — мокайте на уровне своего теста тем же
приёмом (`appRequire(...)` + `vi.spyOn`), либо подменяя `require.cache` до импорта app.

## Юнит-тест (чистая логика)

```ts
import { describe, expect, test } from "vitest";
import { normalizeEventDateFields } from "../../../services/eventScheduleService";

test("...", () => {
  expect(normalizeEventDateFields({ dateDisplayMode: "permanent", isPermanent: true }).date_display)
    .toBe("Постоянное");
});
```

## Интеграционный тест (supertest + Mongo)

```ts
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { app } from "../helpers/app";
import { connectTestDB, clearTestDB, closeTestDB } from "../helpers/db";
import { createVerifiedUser } from "../helpers/auth";

beforeAll(connectTestDB);
afterEach(clearTestDB);
afterAll(closeTestDB);

it("GET /user/me → 200 для авторизованного", async () => {
  const { token } = await createVerifiedUser({ role: "user" });
  const res = await request(app).get("/user/me").set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
});
```

`privilege()` проверяет JWT **и** грузит User из БД (isVerified + роль) — одного подписанного токена
мало, нужен посеянный пользователь. `createVerifiedUser({ role })` делает и то, и другое.

## Фабрики

```ts
import { buildEvent } from "../factories/event.factory";
const Event = appRequire("./models/Event");
const event = await Event.create(buildEvent({ category: "Концерт" }));
```

Каноничные фабрики (`user`, `event`, `refreshToken`, `parserRun`, `blacklist`) живут в
`tests/factories/`. Свои узкие формы кладите в `tests/factories/<домен>.factory.ts`.

## Политика по багам

Тест проверяет **задуманное** поведение. Если найденный баг мешает:

1. Пометь баг **прямо в коде** маркером `// BUG(mapa): <короткое описание>` в файле-источнике.
2. В тесте — `test.skip`/`test.todo` с комментарием-ссылкой на этот баг.
3. **Не чини** баг в тестовой ветке.

Маркеры `// BUG(mapa)` — источник истины. В самом конце (после мержа всех веток) они батчем
выгружаются в Trello (доска Development → Inbox, label Backend) отдельным заходом.

## Покрытие

Целевой порог — ~70% по критическим путям. Жёсткий гейт (`coverage.thresholds`) в `vitest.config.ts`
намеренно **выключен** до мержа всех доменных вертикалей (иначе он валит каждую промежуточную ветку,
покрывающую лишь свой срез). Включается финальным шагом.
