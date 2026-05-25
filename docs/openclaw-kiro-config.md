# Connecting Kiro (cloud-opus-4.6) in OpenClaw

Configuration for using the **Kiro** API (https://api.kiro.cheap) with the **claude-opus-4.6** (or **auto**) model in OpenClaw.

**Official API documentation:** [Kiro.cheap API Reference - Overview](https://kiro.cheap/docs/api-reference/overview)  
Base URL: `https://api.kiro.cheap`. For OpenAI-compatible chat: `POST /v1/chat/completions`; authenticate via an environment-managed API key using `Authorization: Bearer $KIRO_API_KEY` or `x-api-key`.

## 1. OpenClaw config

Configuration file: **`~/.openclaw/openclaw.json`** (JSON5 format).

> **Note:** The previously referenced `docs/openclaw-kiro-snippet.json5` has been deleted — do not use it as a reference. Generate your own API key and use the environment-variable approach below (Option A).
>
> Use neutral placeholders in tracked docs (for example `REPLACE_WITH_REAL_KIRO_API_KEY`), not token-shaped examples that look like live secrets and trigger secret scanners.

### Option A: Key in an environment variable (recommended)

In `~/.openclaw/.env` or in the environment:

```bash
export KIRO_API_KEY="REPLACE_WITH_REAL_KIRO_API_KEY"
```

In **openclaw.json** in the `models.providers` section add:

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

### Direct key embedding in config: do not use

Do **not** place the API key directly in `openclaw.json`. Keep the key only in `~/.openclaw/.env`, CI secrets, or another secret manager, and reference it via `${KIRO_API_KEY}`.

## 2. If the API uses the Anthropic (messages) format

If Kiro outputs the format `/v1/messages` (Anthropic), replace the provider with:

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

## 3. Error «No available auth profile for anthropic»

Internal OpenClaw tasks (slug-generator, session, etc.) can be requested by the **anthropic** provider. If you only have Kiro, add to `models.providers` a provider named **anthropic** pointing to the same Kiro (URL + env-managed key):

```json5
"anthropic": {
  "baseUrl": "https://api.kiro.cheap/v1",
  "apiKey": "${KIRO_API_KEY}",
  "api": "openai-completions",
  "models": [
    { "id": "claude-opus-4.6", "name": "Claude Opus 4.6", "contextWindow": 200000 }
  ]
}
```

Ready config with both providers (kiro + anthropic → Kiro): use Option A above with `${KIRO_API_KEY}` — do not commit keys to git.

## 4. Ollama: «Failed to discover Ollama models: TypeError: fetch failed»

Indicates that OpenClaw is trying to connect to Ollama (usually http://localhost:11434), but the service is not running or is unavailable. If you don't use Ollama, you can ignore the error. If you need Ollama, run it locally.

## 5. Verification

```bash
openclaw models status
openclaw agent --message "Hello"
```

Or run TUI: `openclaw tui`.

## 6. Parameters from the request

| Parameter | Meaning |
|------------|----------|
| Base URL   | https://api.kiro.cheap |
| Model | claude-opus-4.6 |
| API Key | store only in env / secret manager (`KIRO_API_KEY`) |

In the config for OpenAI-compatible APIs, the baseUrl is usually specified with the path `/v1` (for example `https://api.kiro.cheap/v1`). If Kiro has a different path to chat completions, substitute it in `baseUrl`.
