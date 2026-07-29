function isInvalidPart(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === 'undefined' || normalized === 'null';
}

export function composeTestId(parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => typeof part === 'string')
    .map((part) => part.trim())
    .filter((part) => !isInvalidPart(part))
    .join('__');
}

export function requireTestId(value: string | null | undefined, context: string): string {
  const normalized = composeTestId([value]);
  if (!normalized) {
    throw new Error(`Invalid data-testid for ${context}: "${String(value)}"`);
  }
  return normalized;
}
