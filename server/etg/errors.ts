import type { EtgErrorResponse } from './types.js';

export function etgError(code: string, error: string): EtgErrorResponse {
  return { code, error };
}

export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  INTERNAL: 'INTERNAL_ERROR',
} as const;

export function isEtgError(value: unknown): value is EtgErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'error' in value &&
    typeof (value as EtgErrorResponse).code === 'string'
  );
}
