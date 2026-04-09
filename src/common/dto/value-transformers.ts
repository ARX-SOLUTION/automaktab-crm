import { TransformFnParams } from 'class-transformer';

function isEmpty(value: unknown): value is '' | null | undefined {
  return value === '' || value === null || value === undefined;
}

function normalizeString(value: unknown): string | unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export function sanitizeEmptyStrings(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeEmptyStrings(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeEmptyStrings(item)]),
    );
  }

  return value === '' ? undefined : value;
}

export function toOptionalText({ value }: TransformFnParams): unknown {
  if (isEmpty(value)) {
    return undefined;
  }

  const normalized = normalizeString(value);
  return normalized === '' ? undefined : normalized;
}

export function toOptionalNumber({ value }: TransformFnParams): unknown {
  if (isEmpty(value)) {
    return undefined;
  }

  const normalized = normalizeString(value);
  if (normalized === '') {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? normalized : parsed;
}

export function toOptionalBoolean({ value }: TransformFnParams): unknown {
  if (isEmpty(value)) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '') {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return value;
}

export function toOptionalDate({ value }: TransformFnParams): unknown {
  if (isEmpty(value)) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized === '') {
      return undefined;
    }

    return new Date(normalized);
  }

  return new Date(value as string | number);
}
