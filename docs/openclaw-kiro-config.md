# Подключение Kiro (claude-opus-4.6) в OpenClaw

Конфигурация для использования API **Kiro** (https://api.kiro.cheap) с моделью **claude-opus-4.6** (или **auto**) в OpenClaw.

**Официальная документация API:** [Kiro.cheap API Reference — Overview](https://kiro.cheap/docs/api-reference/overview)  
Base URL: `https://api.kiro.cheap`. Для OpenAI-совместимого чата: `POST /v1/chat/completions`; авторизация: `Authorization: Bearer sk-aw-...` или `x-api-key`.

## 1. Конфиг OpenClaw

Файл конфигурации: **`~/.openclaw/openclaw.json`** (формат JSON5).

Готовый сниппет с ключом и моделью по умолчанию: **`docs/openclaw-kiro-snippet.json5`** — скопируйте его содержимое в `~/.openclaw/openclaw.json` (или влейте в соответствующие секции).

### Вариант A: ключ в переменной окружения (рекомендуется)

В `~/.openclaw/.env` или в окружении:

```bash
export KIRO_API_KEY="sk-aw-4900ab96f0a2f10e1996e4f3bc80709c"
```

В **openclaw.json** в секции `models.providers` добавьте:

```json5
{
  "models": {
    "mode": "merge",
    "providers": {
      "kiro": {
        "baseUrl": "https://api.kiro.cheap/v1",
        "apiKey": "${KIRO_API_KEY}",
        "api": "openai-completions",
        "models": [
          { "id": "claude-opus-4.6", "name": "Claude Opus 4.6", "contextWindow": 200000 }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "kiro/claude-opus-4.6" }
    }
  }
}
```

### Вариант B: ключ прямо в конфиге

Если не используете env, подставьте ключ в `apiKey` (не коммитьте этот файл в git):

```json5
"kiro": {
  "baseUrl": "https://api.kiro.cheap/v1",
  "apiKey": "sk-aw-4900ab96f0a2f10e1996e4f3bc80709c",
  "api": "openai-completions",
  "models": [
    { "id": "claude-opus-4.6", "name": "Claude Opus 4.6", "contextWindow": 200000 }
  ]
}
```

И в `agents.defaults.model.primary`: `"kiro/claude-opus-4.6"`.

## 2. Если API использует формат Anthropic (messages)

Если Kiro отдаёт формат `/v1/messages` (Anthropic), замените провайдер на:

```json5
"kiro": {
  "baseUrl": "https://api.kiro.cheap/v1",
  "apiKey": "${KIRO_API_KEY}",
  "api": "anthropic-messages",
  "models": [
    { "id": "claude-opus-4.6", "name": "Claude Opus 4.6", "contextWindow": 200000 }
  ]
}
```

## 3. Ошибка «No available auth profile for anthropic»

Внутренние задачи OpenClaw (slug-generator, session и др.) могут запрашивать провайдер **anthropic**. Если у вас только Kiro, добавьте в `models.providers` провайдер с именем **anthropic**, указывающий на тот же Kiro (URL + ключ):

```json5
"anthropic": {
  "baseUrl": "https://api.kiro.cheap/v1",
  "apiKey": "sk-aw-4900ab96f0a2f10e1996e4f3bc80709c",
  "api": "openai-completions",
  "models": [
    { "id": "claude-opus-4.6", "name": "Claude Opus 4.6", "contextWindow": 200000 }
  ]
}
```

Готовый конфиг с обоими провайдерами (kiro + anthropic → Kiro): **`docs/openclaw-kiro-snippet.json5`**.

## 4. Ollama: «Failed to discover Ollama models: TypeError: fetch failed»

Означает, что OpenClaw пытается подключиться к Ollama (обычно http://localhost:11434), но сервис не запущен или недоступен. Если Ollama не используете — ошибку можно игнорировать. Если нужен Ollama — запустите его локально.

## 5. Проверка

```bash
openclaw models status
openclaw agent --message "Hello"
```

Или запуск TUI: `openclaw tui`.

## 6. Параметры из запроса

| Параметр    | Значение |
|------------|----------|
| Base URL   | https://api.kiro.cheap |
| Модель     | claude-opus-4.6 |
| API Key    | sk-aw-9faef... (хранить в env или секретно) |

В конфиге для OpenAI-совместимых API обычно указывают baseUrl с путём `/v1` (например `https://api.kiro.cheap/v1`). Если у Kiro другой путь к chat completions — подставьте его в `baseUrl`.
