import Handlebars from 'handlebars';

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export function formatUZS(value: unknown): string {
  const amount = toNumber(value);

  if (amount === null) {
    return '—';
  }

  return `${new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: 0,
  }).format(amount)} soʻm`;
}

export function registerFormatUzHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('formatUZS', (value: unknown) => formatUZS(value));
  handlebars.registerHelper('formatDateUZ', (value: unknown) => {
    if (!value) {
      return '—';
    }

    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  });

  handlebars.registerHelper('add', (left: unknown, right: unknown) => {
    return (toNumber(left) ?? 0) + (toNumber(right) ?? 0);
  });
}
