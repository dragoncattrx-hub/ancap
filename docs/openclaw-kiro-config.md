# Connecting Kiro (cloud-opus-4.6) in OpenClaw

Configuration for using the **Kiro** API (https://api.kiro.cheap) with the **claude-opus-4.6** (or **auto**) model in OpenClaw.

**Official API documentation:** [Kiro.cheap API Reference - Overview](https://kiro.cheap/docs/api-reference/overview)  
Base URL: `https://api.kiro.cheap`. For OpenAI-compatible chat: `POST /v1/chat/completions`; authorization: `Authorization: Bearer sk-aw-...` or `x-api-key`.

## 1. OpenClaw config

Configuration file: **`~/.openclaw/openclaw.json`** (JSON5 format).

Ready snippet with key and default model: **`docs/openclaw-kiro-snippet.json5`** - copy its contents to `~/.openclaw/openclaw.json` (or paste it into the appropriate sections).

### Option A: Key in an environment variable (recommended)

In `~/.openclaw/.env` or in the environment:

```bash
export KIRO_API_KEY="sk-aw-4900ab96f0a2f10e1996e4f3bc80709c"
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

### Option B: the key is directly in the config

If you don't use env, substitute the key in `apiKey` (don't commit this file to git):

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

And in `agents.defaults.model.primary`: `"kiro/claude-opus-4.6"`.

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

Internal OpenClaw tasks (slug-generator, session, etc.) can be requested by the **anthropic** provider. If you only have Kiro, add to `models.providers` a provider named **anthropic** pointing to the same Kiro (URL + key):

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

Ready config with both providers (kiro + anthropic → Kiro): **`docs/openclaw-kiro-snippet.json5`**.

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
| API Key | sk-aw-9faef... (store in env or secret) |

In the config for OpenAI-compatible APIs, the baseUrl is usually specified with the path `/v1` (for example `https://api.kiro.cheap/v1`). If Kiro has a different path to chat completions, substitute it in `baseUrl`.
