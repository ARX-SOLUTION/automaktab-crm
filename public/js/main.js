document.querySelectorAll('form[method="GET"], form[method="get"]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

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

    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  });
});

document.querySelectorAll('[data-modal-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-modal-open');
    if (!target) {
      return;
    }

    const modal = document.getElementById(target);
    if (modal) {
      modal.classList.add('is-open');
    }

    if (target === 'delete-modal') {
      const form = document.getElementById('delete-form');
      const id = button.getAttribute('data-delete-id');
      const deleteUrl = button.getAttribute('data-delete-url');
      if (form && (id || deleteUrl)) {
        form.setAttribute('action', deleteUrl || `/app/students/${id}/delete`);
      }
    }
  });
});

document.querySelectorAll('[data-modal-close]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-modal-close');
    if (!target) {
      return;
    }

    const modal = document.getElementById(target);
    if (modal) {
      modal.classList.remove('is-open');
    }
  });
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('is-open');
    }
  });
});

(function initToast() {
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  var alerts = document.querySelectorAll('.alert');
  alerts.forEach(function (alert) {
    var isSuccess = alert.classList.contains('alert-success');
    var isError = alert.classList.contains('alert-error');
    if (!isSuccess && !isError) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + (isSuccess ? 'toast-success' : 'toast-error');
    toast.textContent = alert.textContent.trim();
    container.appendChild(toast);

    alert.style.display = 'none';

    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () { toast.remove(); }, 250);
    }, 4000);
  });
})();

document.addEventListener('click', function (event) {
  document.querySelectorAll('.dropdown-actions.is-open').forEach(function (dd) {
    if (!dd.contains(event.target)) {
      dd.classList.remove('is-open');
    }
  });
});

document.querySelectorAll('[data-dropdown-toggle]').forEach(function (btn) {
  btn.addEventListener('click', function (event) {
    event.stopPropagation();
    var parent = btn.closest('.dropdown-actions');
    if (parent) {
      parent.classList.toggle('is-open');
    }
  });
});

document.querySelectorAll('form[method="POST"] button[type="submit"]').forEach(function (btn) {
  var form = btn.closest('form');
  if (!form) return;
  form.addEventListener('submit', function () {
    btn.disabled = true;
    btn.style.opacity = '0.6';
  });
});
