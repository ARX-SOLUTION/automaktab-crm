import Handlebars from 'handlebars';

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function registerUiHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('activeClass', (currentPage?: string, targetPage?: string) => {
    return currentPage === targetPage ? 'active' : '';
  });

  handlebars.registerHelper('ifEquals', function ifEquals(
    left: unknown,
    right: unknown,
    truthyOrOptions: unknown,
    maybeOptions?: Handlebars.HelperOptions,
  ) {
    if (maybeOptions) {
      return left === right ? truthyOrOptions : '';
    }

    const options = truthyOrOptions as Handlebars.HelperOptions;
    return left === right ? options.fn(this) : options.inverse(this);
  });

  handlebars.registerHelper('unlessEquals', function unlessEquals(
    left: unknown,
    right: unknown,
    options: Handlebars.HelperOptions,
  ) {
    return left !== right ? options.fn(this) : options.inverse(this);
  });

  handlebars.registerHelper('initials', (value?: string) => {
    if (!value) {
      return 'AT';
    }

    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  handlebars.registerHelper('userInitials', (fullName: unknown) => {
    if (typeof fullName !== 'string' || !fullName.trim()) return '??';
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  });

  handlebars.registerHelper(
    'queryString',
    (currentFilters: Record<string, unknown> | undefined, options: Handlebars.HelperOptions) => {
      const params = new URLSearchParams();
      const merged = {
        ...(currentFilters && typeof currentFilters === 'object' ? currentFilters : {}),
        ...options.hash,
      };

      Object.entries(merged).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        params.set(key, String(value));
      });

      const query = params.toString();
      return query ? `?${query}` : '';
    },
  );

  handlebars.registerHelper('countActiveFilters', (filters: Record<string, unknown> | undefined) => {
    if (!filters || typeof filters !== 'object') {
      return 0;
    }

    return Object.values(filters).filter((value) => value !== undefined && value !== null && value !== '').length;
  });

  handlebars.registerHelper('progressPercent', (active: unknown, total: unknown) => {
    const activeValue = toFiniteNumber(active) ?? 0;
    const totalValue = toFiniteNumber(total) ?? 0;

    if (totalValue <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((activeValue / totalValue) * 100)));
  });

  handlebars.registerHelper('pageStart', (page: unknown, limit: unknown, total: unknown) => {
    const pageValue = toFiniteNumber(page) ?? 1;
    const limitValue = toFiniteNumber(limit) ?? 0;
    const totalValue = toFiniteNumber(total) ?? 0;

    if (totalValue <= 0 || limitValue <= 0) {
      return 0;
    }

    return (pageValue - 1) * limitValue + 1;
  });

  handlebars.registerHelper('pageEnd', (page: unknown, limit: unknown, total: unknown) => {
    const pageValue = toFiniteNumber(page) ?? 1;
    const limitValue = toFiniteNumber(limit) ?? 0;
    const totalValue = toFiniteNumber(total) ?? 0;

    if (totalValue <= 0 || limitValue <= 0) {
      return 0;
    }

    return Math.min(totalValue, pageValue * limitValue);
  });

  handlebars.registerHelper('paginationPages', (page: unknown, totalPages: unknown) => {
    const current = toFiniteNumber(page) ?? 1;
    const total = toFiniteNumber(totalPages) ?? 1;

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => ({
        type: 'page',
        value: index + 1,
        current: index + 1 === current,
      }));
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value?: number; current?: boolean }> = [];
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(total - 1, current + 1);

    items.push({ type: 'page', value: 1, current: current === 1 });

    if (windowStart > 2) {
      items.push({ type: 'ellipsis' });
    }

    for (let value = windowStart; value <= windowEnd; value += 1) {
      items.push({ type: 'page', value, current: value === current });
    }

    if (windowEnd < total - 1) {
      items.push({ type: 'ellipsis' });
    }

    items.push({ type: 'page', value: total, current: current === total });
    return items;
  });
}
