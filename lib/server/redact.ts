const SECRET_PATTERNS = [
  /(api[_ -]?key|api[_ -]?secret|authorization|token|password)\s*[=:]\s*[^\s,;]+/gi,
  /(postgres(?:ql)?:\/\/)[^@\s]+@/gi,
];

export function redactSensitive(value: string): string {
  return SECRET_PATTERNS.reduce((current, pattern) => current.replace(pattern, (_match, prefix: string) => `${prefix}[REDACTED]`), value);
}
