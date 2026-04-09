function toggleCreateCoursePanels(form) {
  const select = form.querySelector('[data-course-type-select]');
  if (!select) {
    return;
  }

  const sync = () => {
    const courseType = select.value;

    form.querySelectorAll('[data-course-panel]').forEach((panel) => {
      const targetType = panel.getAttribute('data-course-panel');
      const isActive = targetType === courseType;

      panel.classList.toggle('is-hidden', !isActive);

      panel.querySelectorAll('input, select, textarea').forEach((field) => {
        if (field.name === 'notes') {
          return;
        }

        if (isActive) {
          field.removeAttribute('disabled');
        } else {
          field.setAttribute('disabled', 'disabled');
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            field.value = '';
          }
          if (field instanceof HTMLSelectElement) {
            field.value = '';
          }
        }
      });
    });
  };

  select.addEventListener('change', sync);
  sync();
}

document.querySelectorAll('[data-student-create-form]').forEach((form) => {
  toggleCreateCoursePanels(form);
});
