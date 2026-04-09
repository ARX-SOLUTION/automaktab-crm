import Handlebars from 'handlebars';

export function registerStudentHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('debtClass', (debt: number) => {
    return debt > 0 ? 'text-danger font-bold' : 'text-success';
  });

  handlebars.registerHelper('debtBadge', (debt: number) => {
    const html =
      debt > 0
        ? '<span class="badge badge-danger">❌ Qarzdor</span>'
        : '<span class="badge badge-success">✅ Toʻlangan</span>';

    return new Handlebars.SafeString(html);
  });

  handlebars.registerHelper('courseTypeLabel', (type: string) => {
    return type === 'express' ? 'Tezkor kurs' : 'Toʻliq kurs';
  });
}
