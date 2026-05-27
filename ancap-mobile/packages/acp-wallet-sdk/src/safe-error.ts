const MAX_SAFE_ERROR_MESSAGE_LENGTH = 240;

const FIELD_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /("(?:mnemonic|seedPhrase|seed_phrase|keystoreJson|keystore_json|rawTx|raw_tx|privateKey|private_key|secretKey|secret_key|apiKey|api_key|token|password)"\s*:\s*")([^"]*)(")/gi,
    replacement: '$1[redacted]$3',
  },
  {
    pattern: /(\b(?:mnemonic|seedPhrase|seed_phrase|keystoreJson|keystore_json|rawTx|raw_tx|privateKey|private_key|secretKey|secret_key|apiKey|api_key|token|password)\b\s*[=:]\s*)([^\n,;]+)/gi,
    replacement: '$1[redacted]',
  },
  {
    pattern: /(Authorization\s*[:=]\s*Bearer\s+)([^\s,;]+)/gi,
    replacement: '$1[redacted]',
  },
  {
    pattern: /(Bearer\s+)([A-Za-z0-9._~-]+)/g,
    replacement: '$1[redacted]',
  },
  {
    pattern: /\b(?:sk_(?:live|test)|pk_(?:live|test)|gh[pousr])_[A-Za-z0-9_\-]+\b/g,
    replacement: '[redacted-token]',
  },
];

function truncateMessage(message: string): string {
  if (message.length <= MAX_SAFE_ERROR_MESSAGE_LENGTH) {
    return message;
  }
  return `${message.slice(0, MAX_SAFE_ERROR_MESSAGE_LENGTH - 1).trimEnd()}…`;
}

export function sanitizeSensitiveText(text: string): string {
  let sanitized = text;
  for (const { pattern, replacement } of FIELD_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return truncateMessage(sanitized.trim());
}

export function safeErrorMessage(error: unknown, fallback: string): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback;

  const sanitized = sanitizeSensitiveText(rawMessage || fallback);
  return sanitized || fallback;
}

export { MAX_SAFE_ERROR_MESSAGE_LENGTH };
