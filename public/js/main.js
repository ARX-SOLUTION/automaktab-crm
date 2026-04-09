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
      if (form && id) {
        form.setAttribute('action', `/app/students/${id}/delete`);
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
