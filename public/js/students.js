document.querySelectorAll('.students-table .btn-edit').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-modal-open');
    if (!target) {
      return;
    }

    const modal = document.getElementById(target);
    if (modal) {
      modal.classList.add('is-open');
    }
  });
});
