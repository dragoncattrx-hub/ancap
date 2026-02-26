# OpenClaw: если чат не отвечает (Kiro)

## Что уже сделано в конфиге

- **Модель по умолчанию:** `kiro/claude-opus-4.6`
- **Провайдер kiro:** `https://api.kiro.cheap/v1`, `openai-completions`, `contextWindow: 200000`, `maxTokens: 8192`
- **Fallbacks:** отключены (пустой массив), чтобы не переходить на провайдеры с 404
- **anthropic** (для slug-generator и т.п.): baseUrl `https://api.kiro.cheap/v1`, тот же ключ Kiro

API Kiro проверен: `POST https://api.kiro.cheap/v1/chat/completions` с `Authorization: Bearer <key>` и моделью `claude-opus-4.6` отвечает успешно.

## Что сделать тебе

1. **Полностью перезапустить OpenClaw**  
   Закрой все окна и панели OpenClaw (включая Control Center / webchat). Заверши процесс в диспетчере задач, если остаётся (Node.js / openclaw). Запусти снова.

2. **Проверить модель в UI**  
   В веб-чате или Control Center в настройках агента явно выбери модель **kiro/claude-opus-4.6** (если есть выбор модели).

3. **Посмотреть логи при ошибке**  
   В терминале:
   ```bash
   openclaw logs --follow
   ```
   Отправь сообщение в чат и посмотри, какая ошибка появляется (model_not_found, 404, timeout, auth и т.д.). Пришли эту строку для точечной правки.

4. **Пересобрать конфиг агента (если нужно)**  
   Если после перезапуска в логе по-прежнему `agent model: custom-api-kiro-cheap/...` или ошибки по контексту:
   ```bash
   openclaw configure
   ```
   Или вручную в `~/.openclaw/openclaw.json` проверь: `agents.defaults.model.primary` = `"kiro/claude-opus-4.6"`, в `models.providers.kiro` нет `contextWindow: 4096`.

## Ошибка: Model context window too small (4096). Minimum is 16000 / agent model: custom-api-kiro-cheap/auto

Если в логах видишь **custom-api-kiro-cheap/auto** и **context window 4096**, значит подтянулся старый провайдер с маленьким контекстом.

**Сделай вручную:**

1. Открой **`~/.openclaw/openclaw.json`**. В блоке `agents.defaults`:
   - В `model.primary` должно быть **`"kiro/claude-opus-4.6"`** (не `custom-api-kiro-cheap/auto`).
   - В `models.providers` не должно быть ключа **`custom-api-kiro-cheap`** — только **`kiro`** с `contextWindow: 200000`.

2. Открой **`~/.openclaw/agents/main/agent/models.json`**. В `providers` оставь только **`kiro`** с `contextWindow: 200000`. Удали весь блок **`custom-api-kiro-cheap`** (у него обычно `contextWindow: 4096`).

3. Перезапусти OpenClaw. В логе при старте должно быть: `agent model: kiro/claude-opus-4.6`.

Команда **`openclaw onboard`** может снова подмешивать провайдеры; после неё проверь эти два файла.

## Файлы конфига

- `~/.openclaw/openclaw.json` — основной конфиг (primary, providers, env)
- `~/.openclaw/agents/main/agent/auth-profiles.json` — ключи и lastGood (kiro:default с ключом Kiro)
- `~/.openclaw/agents/main/agent/models.json` — провайдеры, подхватываются при merge

После изменений в этих файлах OpenClaw нужно перезапускать.

---

## Пустой ответ (run успешен, но сообщение не видно)

Если в логах `isError=false`, `embedded run done`, но в чате ответ модели не появляется — в сессионном файле (`~/.openclaw/agents/main/sessions/<sessionId>.jsonl`) у сообщений с `"role":"assistant"` может быть **`"content": []`** при ненулевом `usage.output`. Текст тогда генерируется, но не попадает в сообщение.

**Что сделать:** выставить **thinking в off** для провайдера Kiro, чтобы ответ шёл обычным текстом, а не в блоках thinking:

В `openclaw.json` → `agents.defaults`:
```json
"thinkingDefault": "off"
```

Перезапустить OpenClaw и написать в чат снова. Если сообщения появятся — значит, с Kiro и текущей версией OpenClaw режим thinking лучше не использовать.

---

## Kiro API не отдаёт текст ответа (причина «не отвечает»)

**Проверено:** запросы к `https://api.kiro.cheap/v1/chat/completions` (и без `stream`, и со `stream: true`) возвращают пустой контент:

- **Без стрима:** `choices[0].message.content` = `""` при ненулевом `usage.completion_tokens`.
- **Со стримом:** приходит один чанк с пустым `delta: {}` и сразу `[DONE]`.

То есть проблема на стороне **Kiro API** (проки/обёртки api.kiro.cheap): токены списываются, но текст в ответ не подставляется. OpenClaw тут ни при чём.

**Что сделать:**

1. **Временно перейти на другую модель** — в OpenClaw выбрать модель другого провайдера (например **OpenRouter**), у которого ответ приходит с заполненным `content`. В конфиге можно сменить primary:
   ```json
   "primary": "openrouter/meta-llama/llama-3.3-70b-instruct:free"
   ```
   (или другую модель OpenRouter, для которой есть ключ в `env.OPENROUTER_API_KEY`).

2. **Написать в поддержку Kiro** — спросить, почему для `api.kiro.cheap` в ответе chat completions приходит пустой `message.content` и пустой `delta`, при том что `completion_tokens` > 0. Возможно, нужен другой endpoint или параметр.

---

## Сообщения пропадают

Возможные причины:

### 1. Ответы ассистента пустые (Kiro)

Сообщения **сохраняются** в сессии (`~/.openclaw/agents/main/sessions/<sessionId>.jsonl`), но у ответов модели поле **`content` пустое** (`"content": []`). В чате такие ответы не отображаются — создаётся впечатление, что сообщения пропали. Причина та же: **Kiro API не возвращает текст** в ответе (см. раздел выше). Решение: другой провайдер или ждать исправления со стороны Kiro.

### 2. Compaction сворачивает старые сообщения

При длинных диалогах OpenClaw по умолчанию делает **compaction**: старые сообщения заменяются одним саммари, в ленте их уже не видно. Чтобы **не сворачивать** историю, в `openclaw.json` → `agents.defaults` добавлено:

```json
"compaction": { "mode": "off" }
```

После изменения перезапусти OpenClaw. Минус: при очень длинной сессии контекст может не влезать в окно модели — тогда либо снова включить compaction, либо начать новую сессию (`/new` или `/reset`).

### 3. История не подгружается после переподключения

Если открываешь чат с другого устройства или после рестарта gateway, клиент (TUI/Control UI) может не подтянуть историю с сервера. Рекомендация: использовать один основной клиент для длинных разговоров; Control UI и TUI показывают транскрипт с gateway как источник правды.
