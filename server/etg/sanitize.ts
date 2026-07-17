/** Strip HTML tags and trim whitespace. Preserves all scripts/diacritics. */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
}
