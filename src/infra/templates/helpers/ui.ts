import Handlebars from 'handlebars';

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
}
