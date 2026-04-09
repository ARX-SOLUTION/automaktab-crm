const loginForm = document.getElementById('loginForm');
const phoneInput = document.getElementById('phone');

if (phoneInput) {
  phoneInput.addEventListener('input', (event) => {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.startsWith('998')) {
      value = `+${value}`;
    } else if (value.length > 0) {
      value = `+998${value}`;
    }

    const parts = value.match(/^\+998(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (!parts) {
      input.value = value.slice(0, 13);
      return;
    }

    input.value = ['+998', parts[1], parts[2], parts[3], parts[4]]
      .filter(Boolean)
      .join(' ')
      .trim();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    const phone = phoneInput ? phoneInput.value.replace(/\s/g, '') : '';
    const password = document.getElementById('password');

    if (!/^\+998\d{9}$/.test(phone) || !password || password.value.length < 6) {
      event.preventDefault();
    }
  });
}
