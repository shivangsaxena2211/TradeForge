import "server-only";

const SENSITIVE_ERROR_PATTERNS = [
  /password/i,
  /mnemonic/i,
  /private\s*key/i,
  /privatekey/i,
  /auth_secret/i,
  /database_url/i,
  /postgresql:\/\//i,
  /prisma/i,
  /invocation/i,
  /stack trace/i,
];

export function isSensitiveErrorMessage(message: string): boolean {
  return SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Log server-side diagnostics without echoing secrets or full stack payloads to clients.
 */
export function logServerError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`${context}:`, error.name, error.message);
    return;
  }

  console.error(`${context}:`, "Unknown error");
}

export function getSafeApiErrorMessage(
  error: unknown,
  fallback = "Unable to process request.",
): string {
  if (error instanceof Error && isSensitiveErrorMessage(error.message)) {
    return fallback;
  }

  return fallback;
}
