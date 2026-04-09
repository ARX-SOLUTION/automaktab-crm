import Handlebars from 'handlebars';

export function registerStudentHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('debtClass', (debt: number) => {
    return debt > 0 ? 'text-danger font-bold' : 'text-success';
  });

  handlebars.registerHelper('debtBadge', (debt: number) => {
    const html =
      debt > 0
        ? '<span class="badge badge-danger">Qarzdor</span>'
        : '<span class="badge badge-success">Toʻlangan</span>';

    return new Handlebars.SafeString(html);
  });

  handlebars.registerHelper('courseTypeLabel', (type: string) => {
    return type === 'express' ? 'Tezkor kurs' : 'Toʻliq kurs';
  });

  handlebars.registerHelper('studentStatusLabel', (status: string) => {
    const labels: Record<string, string> = {
      active: 'Faol',
      completed: 'Yakunlangan',
      dropped: 'Tashlab ketgan',
      suspended: 'To‘xtatilgan',
    };

    return labels[status] ?? status;
  });

  handlebars.registerHelper('studentStatusClass', (status: string) => {
    const classes: Record<string, string> = {
      active: 'status-pill success',
      completed: 'status-pill info',
      dropped: 'status-pill danger',
      suspended: 'status-pill warning',
    };

    return classes[status] ?? 'status-pill neutral';
  });

  handlebars.registerHelper('studentResultLabel', (result: string) => {
    const labels: Record<string, string> = {
      pending: 'Kutilmoqda',
      passed: 'O‘tgan',
      failed: 'Yiqilgan',
    };

    return labels[result] ?? result;
  });

  handlebars.registerHelper('studentResultClass', (result: string) => {
    const classes: Record<string, string> = {
      pending: 'status-pill neutral',
      passed: 'status-pill success',
      failed: 'status-pill danger',
    };

    return classes[result] ?? 'status-pill neutral';
  });

  handlebars.registerHelper('paymentMethodLabel', (method: string | null) => {
    const labels: Record<string, string> = {
      cash: 'Naqd',
      card: 'Karta',
      transfer: 'O‘tkazma',
    };

    if (!method) {
      return '—';
    }

    return labels[method] ?? method;
  });

  handlebars.registerHelper('boolIcon', (value: boolean | null | undefined) => {
    const html = value
      ? '<span class="bool-indicator is-true" aria-label="Ha">✓</span>'
      : '<span class="bool-indicator is-false" aria-label="Yo‘q">✕</span>';

    return new Handlebars.SafeString(html);
  });
}
