const toastRegion = document.getElementById('toast-region');
const deleteModalDefaults = {
  title: "Amalni tasdiqlang",
  description: "Bu amal qaytarilmaydi. Davom etishdan oldin yozuv to'g'riligini tekshiring.",
  button: 'Ha, davom etish',
  loadingText: 'Bajarilmoqda...',
};

function buildCleanUrl(form) {
  const action = form.getAttribute('action') || window.location.pathname;
  const url = new URL(action, window.location.origin);
  const formData = new FormData(form);

  formData.forEach((value, key) => {
    if (typeof value !== 'string') {
      return;
    }

    const normalized = value.trim();

    if (normalized) {
      url.searchParams.set(key, normalized);
    }
  });

  return `${url.pathname}${url.search}${url.hash}`;
}

function setButtonLoading(button, loadingText) {
  if (!button || button.dataset.loadingApplied === 'true') {
    return;
  }

  button.dataset.loadingApplied = 'true';
  button.dataset.originalHtml = button.innerHTML;
  button.disabled = true;
  button.classList.add('is-loading');

  const label = loadingText || button.dataset.loadingText || 'Yuborilmoqda...';
  button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${label}</span>`;
}

function showToast(message, type = 'success') {
  if (!toastRegion || !message) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const body = document.createElement('div');
  body.className = 'toast-body';

  const title = document.createElement('strong');
  title.textContent = type === 'error' ? 'Xatolik' : 'Bajarildi';

  const text = document.createElement('span');
  text.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Yopish');
  closeButton.textContent = '×';

  body.appendChild(title);
  body.appendChild(text);
  toast.appendChild(body);
  toast.appendChild(closeButton);

  const removeToast = () => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 180);
  };

  closeButton.addEventListener('click', removeToast);
  toastRegion.appendChild(toast);
  window.setTimeout(removeToast, 4200);
}

function enhanceFlashToasts() {
  document.querySelectorAll('[data-flash-toast]').forEach((node) => {
    const type = node.getAttribute('data-flash-toast') || 'success';
    const message = node.textContent?.trim();

    showToast(message, type);
    node.remove();
  });
}

function openModalById(id) {
  if (!id) {
    return;
  }

  const modal = document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.classList.add('is-open');
  document.body.classList.add('has-modal-open');

  window.requestAnimationFrame(() => {
    const focusable = modal.querySelector(
      '[autofocus], input:not([type="hidden"]), select, textarea, button',
    );

    if (focusable instanceof HTMLElement) {
      focusable.focus();
    }
  });
}

function closeModal(modal) {
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');

  if (!document.querySelector('.modal.is-open')) {
    document.body.classList.remove('has-modal-open');
  }
}

function configureDeleteModal(trigger) {
  const form = document.getElementById('delete-form');
  const title = document.getElementById('delete-modal-title');
  const description = document.getElementById('delete-modal-description');
  const submit = document.getElementById('delete-modal-submit');

  if (!(form instanceof HTMLFormElement) || !(submit instanceof HTMLButtonElement)) {
    return;
  }

  form.setAttribute('action', trigger.getAttribute('data-confirm-action') || '#');

  if (title) {
    title.textContent = trigger.getAttribute('data-confirm-title') || deleteModalDefaults.title;
  }

  if (description) {
    description.textContent =
      trigger.getAttribute('data-confirm-description') || deleteModalDefaults.description;
  }

  submit.textContent = trigger.getAttribute('data-confirm-button') || deleteModalDefaults.button;
  submit.dataset.loadingText =
    trigger.getAttribute('data-confirm-loading-text') || deleteModalDefaults.loadingText;
  submit.dataset.loadingApplied = 'false';
}

function bindGlobalForms() {
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const method = (form.getAttribute('method') || 'GET').toUpperCase();
      const submitter =
        event.submitter instanceof HTMLButtonElement ? event.submitter : form.querySelector('[type="submit"]');

      if (method === 'GET') {
        event.preventDefault();

        if (submitter instanceof HTMLButtonElement) {
          setButtonLoading(submitter, submitter.dataset.loadingText || 'Yuklanmoqda...');
        }

        window.location.assign(buildCleanUrl(form));
        return;
      }

      if (submitter instanceof HTMLButtonElement) {
        setButtonLoading(submitter);
      }
    });
  });
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;

  if (!target) {
    return;
  }

  const openTrigger = target.closest('[data-modal-open]');
  if (openTrigger instanceof HTMLElement) {
    const modalId = openTrigger.getAttribute('data-modal-open');

    if (modalId === 'delete-modal') {
      configureDeleteModal(openTrigger);
    }

    openModalById(modalId);
    return;
  }

  const closeTrigger = target.closest('[data-modal-close]');
  if (closeTrigger instanceof HTMLElement) {
    const modalId = closeTrigger.getAttribute('data-modal-close');
    const modal = modalId ? document.getElementById(modalId) : closeTrigger.closest('.modal');
    closeModal(modal);
    return;
  }

  const modalBackdrop = target.classList.contains('modal') ? target : null;
  if (modalBackdrop instanceof HTMLElement) {
    closeModal(modalBackdrop);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') {
    return;
  }

  document.querySelectorAll('.modal.is-open').forEach((modal) => {
    if (modal instanceof HTMLElement) {
      closeModal(modal);
    }
  });
});

bindGlobalForms();
enhanceFlashToasts();
