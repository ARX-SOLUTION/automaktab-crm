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
  handlebars.registerHelper('add', (left: unknown, right: unknown) => {
    return (toNumber(left) ?? 0) + (toNumber(right) ?? 0);
  });
}
