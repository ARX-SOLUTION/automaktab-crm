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

const paymentFieldLabels = {
  amountPaid: "Asosiy to'lov",
  initialPayment: "1-to'lov",
  secondPayment: "2-to'lov",
  thirdPayment: "3-to'lov",
};

const moneyFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('uz-UZ', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const paymentHistoryCache = new Map();
const paymentHistoryRequests = new Map();

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${moneyFormatter.format(amount)} soʻm`;
}

function formatDateTime(value) {
  if (!value) {
    return "Sana yo'q";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sana yo'q";
  }

  return dateTimeFormatter.format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHistoryPlaceholder(container, title, description, isError = false) {
  container.innerHTML = `
    <div class="payment-history-item${isError ? ' is-error' : ''}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(description)}</span>
    </div>
  `;
}

function renderHistoryLoading(container) {
  container.innerHTML = Array.from({ length: 3 })
    .map(
      () => `
        <div class="payment-history-item">
          <div class="payment-history-item-header">
            <div class="payment-history-meta">
              <span class="skeleton-cell" style="width: 7rem;"></span>
              <span class="skeleton-cell" style="width: 12rem;"></span>
            </div>
            <span class="skeleton-cell" style="width: 5rem;"></span>
          </div>
          <div class="payment-history-item-footer">
            <span class="skeleton-cell" style="width: 8rem;"></span>
            <span class="skeleton-cell" style="width: 10rem;"></span>
          </div>
        </div>
      `,
    )
    .join('');
}

function renderHistory(container, logs) {
  if (!Array.isArray(logs) || !logs.length) {
    renderHistoryPlaceholder(
      container,
      "Hali to'lov loglari yo'q",
      "To'lov yangilanganida bu yerda operator va summa o'zgarishi ko'rinadi.",
    );
    return;
  }

  container.innerHTML = logs
    .map((log) => {
      const amount = Number(log.amount || 0);
      const amountClass = amount >= 0 ? 'positive' : 'negative';
      const amountText = `${amount >= 0 ? '+' : '-'}${formatMoney(Math.abs(amount))}`;
      const fieldLabel = paymentFieldLabels[log.paymentField] || log.paymentField || "To'lov";
      const changedBy = log.changedBy?.fullName || "Noma'lum operator";

      return `
        <article class="payment-history-item">
          <div class="payment-history-item-header">
            <div class="payment-history-meta">
              <strong>${escapeHtml(fieldLabel)}</strong>
              <span>${escapeHtml(formatDateTime(log.createdAt))}</span>
            </div>
            <span class="payment-history-amount ${amountClass}">${escapeHtml(amountText)}</span>
          </div>
          <div class="payment-history-item-footer">
            <span>${escapeHtml(formatMoney(log.previousAmount))} → ${escapeHtml(formatMoney(log.newAmount))}</span>
            <strong>${escapeHtml(changedBy)}</strong>
          </div>
        </article>
      `;
    })
    .join('');
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload?.error?.message || "To'lov tarixini yuklab bo'lmadi";
  } catch {
    return "To'lov tarixini yuklab bo'lmadi";
  }
}

async function loadPaymentHistory(panel, options = {}) {
  const url = panel.getAttribute('data-payment-history-url');
  const container = panel.querySelector('[data-payment-history-content]');
  const force = Boolean(options.force);

  if (!url || !(container instanceof HTMLElement)) {
    return;
  }

  if (!force && paymentHistoryCache.has(url)) {
    renderHistory(container, paymentHistoryCache.get(url));
    return;
  }

  if (!force && paymentHistoryRequests.has(url)) {
    return paymentHistoryRequests.get(url);
  }

  renderHistoryLoading(container);

  const request = fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      return response.json();
    })
    .then((logs) => {
      paymentHistoryCache.set(url, logs);
      renderHistory(container, logs);
    })
    .catch((error) => {
      renderHistoryPlaceholder(
        container,
        'Tarix yuklanmadi',
        error instanceof Error ? error.message : "To'lov tarixini yuklab bo'lmadi",
        true,
      );
    })
    .finally(() => {
      paymentHistoryRequests.delete(url);
    });

  paymentHistoryRequests.set(url, request);
  return request;
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const refreshButton = target?.closest('[data-payment-history-refresh]');

  if (!(refreshButton instanceof HTMLButtonElement)) {
    return;
  }

  const panel = refreshButton.closest('[data-payment-history]');

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  loadPaymentHistory(panel, { force: true });
});

document.addEventListener('app:modal-open', (event) => {
  const modal = event.detail?.modal;

  if (!(modal instanceof HTMLElement)) {
    return;
  }

  modal.querySelectorAll('[data-payment-history]').forEach((panel) => {
    if (panel instanceof HTMLElement) {
      void loadPaymentHistory(panel);
    }
  });
});
