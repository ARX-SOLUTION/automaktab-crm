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
}
