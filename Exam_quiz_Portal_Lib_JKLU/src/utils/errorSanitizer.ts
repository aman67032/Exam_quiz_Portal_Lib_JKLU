const UNSAFE_ERROR_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/i,
  /\b[a-z]+:\/\/\S+/i,
  /(?:^|\s)(?:\/var\/|\/usr\/|\/home\/|\/app\/|[A-Za-z]:\\)/,
  /\b(?:src|backend|node_modules)\/[\w./-]+/i,
  /\.(?:js|ts|tsx|jsx|mjs|cjs|py|sql)(?::\d+)?\b/i,
  /\bat\s+[\w.<>]+\s*\(/,
  /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|AxiosError|Error:|Prisma|Sequelize|PostgreSQL|Postgres|ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT|ERR_[A-Z_]+)\b/,
  /\b(?:Request failed with status code|Network Error|timeout of \d+ms exceeded|Cannot read propert|Unexpected token|JSON\.parse)\b/i,
  /<\s*!DOCTYPE|<\s*html/i,
];

/**
 * Prevents raw URLs, file paths, stack traces, or code/network errors from being shown in the UI.
 */
export function sanitizeErrorMessage(raw: unknown, fallback = 'Error'): string {
  if (typeof raw !== 'string') {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 240) {
    return fallback;
  }

  for (const pattern of UNSAFE_ERROR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return fallback;
    }
  }

  return trimmed;
}
