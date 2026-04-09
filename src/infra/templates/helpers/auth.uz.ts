import Handlebars from 'handlebars';

export function registerAuthHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('branchOptions', function branchOptions(
    branches: Array<{ id: string; name: string }>,
    user: { branchId: string | null; branchName: string | null; isManager: boolean },
    selectedId?: string,
  ) {
    if (user.isManager) {
      return new Handlebars.SafeString(
        `<option value="${user.branchId ?? ''}" selected>${user.branchName ?? '—'}</option>`,
      );
    }

    const options = ['<option value="">Barchasi</option>'];
    for (const branch of branches) {
      const selected = branch.id === selectedId ? ' selected' : '';
      options.push(`<option value="${branch.id}"${selected}>${branch.name}</option>`);
    }

    return new Handlebars.SafeString(options.join(''));
  });

  handlebars.registerHelper('actionButtons', function actionButtons(
    studentId: string,
    user: { isOwner: boolean },
  ) {
    const buttons = [
      `<button class="btn-icon btn-edit" type="button" data-modal-open="student-edit-${studentId}" title="Tahrirlash">Tahrir</button>`,
    ];

    if (user.isOwner) {
      buttons.push(
        `<button class="btn-icon btn-delete" type="button" data-modal-open="delete-modal" data-confirm-action="/app/students/${studentId}/delete" data-confirm-title="Talabani o'chirish" data-confirm-description="Tanlangan talabani tizimdan olib tashlamoqchimisiz?" data-confirm-button="Ha, o'chirish" title="O'chirish">O'chir</button>`,
      );
    }

    return new Handlebars.SafeString(buttons.join(''));
  });
}
