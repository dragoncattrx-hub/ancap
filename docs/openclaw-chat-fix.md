# OpenClaw: if chat doesn't respond (Kiro)

## What has already been done in the config

- **Default model:** `kiro/claude-opus-4.6`
- **Kiro Provider:** `https://api.kiro.cheap/v1`, `openai-completions`, `contextWindow: 200000`, `maxTokens: 8192`
- **Fallbacks:** disabled (empty array) to avoid switching to providers with 404
- **anthropic** (for slug-generator, etc.): baseUrl `https://api.kiro.cheap/v1`, same Kiro key

Kiro API tested: `POST https://api.kiro.cheap/v1/chat/completions` with `Authorization: Bearer <key>` and model `cloude-opus-4.6` responds successfully.

## What should you do

1. **Completely restart OpenClaw**  
   Close all OpenClaw windows and panels (including Control Center / webchat). Terminate the process in the task manager if it remains (Node.js / openclaw). Run again.

2. **Check the model in the UI**  
   In web chat or Control Center in the agent settings, explicitly select the **kiro/claude-opus-4.6** model (if there is a model choice).

3. **View logs for errors**  
   In the terminal:
   ```bash
   openclaw logs --follow
   ```
   Send a message to the chat and see what error appears (model_not_found, 404, timeout, auth, etc.). Send this line for spot editing.

4. **Rebuild the agent config (if necessary)**  
   If after a restart the log still shows `agent model: custom-api-kiro-cheap/...` or errors in the context:
   ```bash
   openclaw configure
   ```
   Or manually in `~/.openclaw/openclaw.json` check: `agents.defaults.model.primary` = `"kiro/claude-opus-4.6"`, in `models.providers.kiro` there is no `contextWindow: 4096`.

## Error: Model context window too small (4096). Minimum is 16000 / agent model: custom-api-kiro-cheap/auto

If you see **custom-api-kiro-cheap/auto** and **context window 4096** in the logs, then the old provider with a small context has been updated.

**Do it manually:**

1. Open **`~/.openclaw/openclaw.json`**. In the `agents.defaults` block:
   - `model.primary` should have **`"kiro/claude-opus-4.6"`** (not `custom-api-kiro-cheap/auto`).
   - There should not be a **`custom-api-kiro-cheap`** key in `models.providers` - only **`kiro`** with `contextWindow: 200000`.

2. Open **`~/.openclaw/agents/main/agent/models.json`**. IN `providers` leave only **`kiro`** with `contextWindow: 200000`. Remove the entire **`custom-api-kiro-cheap`** block (it usually has `contextWindow: 4096`).

3. Restart OpenClaw. The log at startup should contain: `agent model: kiro/claude-opus-4.6`.

The **`openclaw onboard`** command can again mix providers; After that, check these two files.

## Config files

- `~/.openclaw/openclaw.json` - main config (primary, providers, env)
- `~/.openclaw/agents/main/agent/auth-profiles.json` - keys and lastGood (kiro:default with Kiro key)
- `~/.openclaw/agents/main/agent/models.json` — providers, picked up during merge

After changes to these files, OpenClaw must be restarted.

---

## Empty response (run is successful, but the message is not visible)

If `isError=false`, `embedded run done` is in the logs, but the model’s response does not appear in the chat, in the session file (`~/.openclaw/agents/main/sessions/<sessionId>.jsonl`) messages with `"role":"assistant"` may have **`"content": []`** if `usage.output` is non-zero. The text is then generated, but does not end up in the message.

**What to do:** set **thinking to off** for the Kiro provider, so that the response comes in plain text, and not in thinking blocks:

IN `openclaw.json` → `agents.defaults`:
```json
"thinkingDefault": "off"
```

Restart OpenClaw and write to the chat again. If messages appear, it means that it is better not to use thinking mode with Kiro and the current version of OpenClaw.

---

## Kiro API does not return the response text (the reason is “not responding”)

**Tested:** requests to `https://api.kiro.cheap/v1/chat/completions` (both without `stream` and with `stream: true`) return empty content:

- **Without stream:** `choices[0].message.content` = `""` if `usage.completion_tokens` is non-zero.
- **With the stream:** one chunk comes with an empty `delta: {}` and immediately `[DONE]`.

That is, the problem is on the side of the **Kiro API** (api.kiro.cheap procs/wrappers): tokens are written off, but the text is not substituted in response. OpenClaw has nothing to do with it.

**What to do:**

1. **Temporarily switch to another model** - in OpenClaw, select the model of another provider (for example **OpenRouter**), whose response comes with filled `content`. In the config you can change primary:
   ```json
   "primary": "openrouter/meta-llama/llama-3.3-70b-instruct:free"
   ```
   (or another OpenRouter model for which there is a key in `env.OPENROUTER_API_KEY`).

2. **Write to Kiro support** - ask why for `api.kiro.cheap` the chat completions response comes with an empty `message.content` and an empty `delta`, despite the fact that `completion_tokens` > 0. Perhaps another endpoint or parameter is needed.

---

## Messages disappear

Possible reasons:

### 1. Assistant replies are empty (Kiro)

Messages are **saved** in the session (`~/.openclaw/agents/main/sessions/<sessionId>.jsonl`), but model responses have an empty **`content` field** (`"content": []`). Such responses are not displayed in the chat - it seems that the messages have disappeared. The reason is the same: **Kiro API does not return text** in the response (see section above). Solution: another provider or wait for a fix from Kiro.

### 2. Compaction collapses old messages

For long dialogs, OpenClaw does **compaction** by default: old messages are replaced with one summary, and they are no longer visible in the feed. To **not minimize** the story, the following has been added to `openclaw.json` → `agents.defaults`:

```json
"compaction": { "mode": "off" }
```

After the change, restart OpenClaw. Minus: during a very long session, the context may not fit into the model window - then either enable compaction again, or start a new session (`/new` or `/reset`).

### 3. History is not loaded after reconnection

If you open a chat from another device or after a gateway restart, the client (TUI/Control UI) may not retrieve the history from the server. Recommendation: use one main client for long conversations; Control UI and TUI show the gateway transcript as the source of truth.
