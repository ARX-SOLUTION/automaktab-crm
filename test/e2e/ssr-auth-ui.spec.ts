const request = require('supertest');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OWNER_PHONE = process.env.OWNER_PHONE ?? '+998900000000';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'admin123';
const MANAGER_PHONE = process.env.MANAGER_PHONE ?? '+998901111111';
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD ?? 'manager123';

async function loginSsr(phone: string, password: string) {
  const response = await request(BASE_URL)
    .post('/app/login')
    .type('form')
    .send({ phone, password })
    .redirects(0)
    .expect(302);

  return {
    cookie: response.headers['set-cookie'][0].split(';')[0],
    location: response.headers.location,
  };
}

describe('SSR auth and role-based UI', () => {
  jest.setTimeout(30_000);

  it('redirects unauthenticated dashboard requests to app login', async () => {
    await request(BASE_URL)
      .get('/app/dashboard')
      .redirects(0)
      .expect(302)
      .expect('Location', '/app/login');
  });

  it('logs in owner and manager with role-based redirects', async () => {
    const owner = await loginSsr(OWNER_PHONE, OWNER_PASSWORD);
    const manager = await loginSsr(MANAGER_PHONE, MANAGER_PASSWORD);

    expect(owner.location).toBe('/app/dashboard');
    expect(manager.location).toBe('/app/students');
    expect(owner.cookie).toContain('jwt=');
    expect(manager.cookie).toContain('jwt=');
  });

  it('shows manager only own branch and hides owner navigation', async () => {
    const manager = await loginSsr(MANAGER_PHONE, MANAGER_PASSWORD);
    const response = await request(BASE_URL)
      .get('/app/dashboard')
      .set('Cookie', manager.cookie)
      .expect(200);

    expect(response.text).toContain('Minor');
    expect(response.text).not.toContain('/app/branches');
    expect(response.text).not.toContain('Samarqand</option>');
  });

  it('shows owner navigation and branch-wide content', async () => {
    const owner = await loginSsr(OWNER_PHONE, OWNER_PASSWORD);
    const response = await request(BASE_URL)
      .get('/app/dashboard')
      .set('Cookie', owner.cookie)
      .expect(200);

    expect(response.text).toContain('/app/branches');
    expect(response.text).toContain('Samarqand');
    expect(response.text).toContain('Qarzdorlik');
  });

  it('renders students table structure and summary rows', async () => {
    const owner = await loginSsr(OWNER_PHONE, OWNER_PASSWORD);
    const response = await request(BASE_URL)
      .get('/app/students')
      .set('Cookie', owner.cookie)
      .expect(200);

    const headers = [
      'F.I.SH',
      'Telefon',
      'Filial',
      'Kurs turi',
      'Kurs narxi',
      "1-to'lov",
      "2-to'lov",
      "3-to'lov",
      'Qoldiq',
      'Holat',
      'Guruh',
      'Shartnoma',
      'Operator',
      'Amallar',
    ];

    headers.forEach((header) => {
      expect(response.text).toContain(`<th>${header}</th>`);
    });

    expect(response.text).toContain('JAMI NATIJA');
    expect(response.text).toContain("✅ JAMI TO'LANGAN");
    expect(response.text).toContain('❌ JAMI QOLDIQ (QARZDORLIK)');
  });

  it('redirects manager away from owner-only SSR pages and clears cookie on logout', async () => {
    const manager = await loginSsr(MANAGER_PHONE, MANAGER_PASSWORD);

    await request(BASE_URL)
      .get('/app/managers')
      .set('Cookie', manager.cookie)
      .redirects(0)
      .expect(302)
      .expect('Location', '/app/students');

    const logoutResponse = await request(BASE_URL)
      .post('/app/logout')
      .set('Cookie', manager.cookie)
      .redirects(0)
      .expect(302)
      .expect('Location', '/app/login');

    expect(logoutResponse.headers['set-cookie'][0]).toContain('jwt=;');
  });
});

export {};
