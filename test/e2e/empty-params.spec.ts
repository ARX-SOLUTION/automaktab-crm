const request = require('supertest');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OWNER_PHONE = process.env.OWNER_PHONE ?? '+998900000000';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'admin123';
const MANAGER_PHONE = process.env.MANAGER_PHONE ?? '+998901111111';
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD ?? 'manager123';

type AuthResponse = {
  accessToken: string;
};

function uniquePhone(prefix: string) {
  return `${prefix}${Date.now().toString().slice(-6)}`;
}

async function loginApi(phone: string, password: string): Promise<string> {
  const response = await request(BASE_URL)
    .post('/auth/login')
    .send({ phone, password })
    .expect(200);

  return (response.body as AuthResponse).accessToken;
}

async function loginSsr(phone: string, password: string) {
  const response = await request(BASE_URL)
    .post('/app/login')
    .type('form')
    .send({ phone, password })
    .redirects(0)
    .expect(302);

  return response.headers['set-cookie'][0].split(';')[0];
}

describe('Empty params regression', () => {
  jest.setTimeout(30_000);

  let ownerToken: string;
  let managerToken: string;
  let ownerCookie: string;

  beforeAll(async () => {
    ownerToken = await loginApi(OWNER_PHONE, OWNER_PASSWORD);
    managerToken = await loginApi(MANAGER_PHONE, MANAGER_PASSWORD);
    ownerCookie = await loginSsr(OWNER_PHONE, OWNER_PASSWORD);
  });

  it('accepts empty query params across API endpoints', async () => {
    await request(BASE_URL)
      .get('/students')
      .query({
        courseType: '',
        branchId: '',
        status: '',
        search: '',
        page: '',
        limit: '',
      })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/students')
      .query({
        courseType: 'express',
        branchId: '',
        status: '',
        page: '',
        limit: '',
      })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/students')
      .query({
        courseType: '',
        branchId: '',
        status: '',
        search: '',
      })
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/users')
      .query({ branchId: '', search: '' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/groups')
      .query({ branchId: '' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/reports/revenue')
      .query({
        branchId: '',
        courseType: '',
        startDate: '',
        endDate: '',
      })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await request(BASE_URL)
      .get('/reports/dashboard')
      .query({ branchId: '', courseType: '' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  it('keeps invalid query params rejected and owner-only routes protected', async () => {
    await request(BASE_URL)
      .get('/students')
      .query({ courseType: 'INVALID' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(BASE_URL)
      .get('/students')
      .query({ branchId: 'not-a-uuid' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(BASE_URL)
      .get('/students')
      .query({ page: '-5' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(BASE_URL)
      .get('/students')
      .query({ status: 'INVALID' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(BASE_URL)
      .get('/reports/revenue')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);

    await request(BASE_URL)
      .get('/reports/dashboard')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);

    await request(BASE_URL)
      .get('/groups/overview')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });

  it('accepts empty optional student body fields while preserving validation', async () => {
    const createResponse = await request(BASE_URL)
      .post('/students')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        firstName: 'Blank',
        lastName: 'Standard',
        phone: uniquePhone('+998984'),
        courseType: 'standard',
        totalPrice: 6000000,
        groupId: '',
        contractNumber: '',
        completionDate: '',
        o83: '',
        hasDocument: '',
        paymentMethod: '',
        result: '',
        notes: '',
      })
      .expect(201);

    const studentId = createResponse.body.id;

    const updateResponse = await request(BASE_URL)
      .patch(`/students/${studentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        firstName: 'Blank Updated',
        groupId: '',
        contractNumber: '',
        completionDate: '',
        o83: '',
        hasDocument: '',
        paymentMethod: '',
        result: '',
        notes: '',
      })
      .expect(200);

    expect(updateResponse.body.firstName).toBe('Blank Updated');

    const paymentResponse = await request(BASE_URL)
      .patch(`/students/${studentId}/payment`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        initialPayment: '',
        secondPayment: '250000',
        thirdPayment: '',
      })
      .expect(200);

    expect(paymentResponse.body.installments.secondPayment).toBe(250000);

    await request(BASE_URL)
      .delete(`/students/${studentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(204);
  });

  it('accepts empty query params across SSR pages', async () => {
    await request(BASE_URL)
      .get('/app/dashboard')
      .query({ branchId: '', status: '', search: '' })
      .set('Cookie', ownerCookie)
      .expect(200);

    await request(BASE_URL)
      .get('/app/students')
      .query({
        branchId: '',
        status: '',
        search: '',
        courseType: '',
        page: '',
        limit: '',
      })
      .set('Cookie', ownerCookie)
      .expect(200);

    await request(BASE_URL)
      .get('/app/managers')
      .query({ branchId: '', search: '' })
      .set('Cookie', ownerCookie)
      .expect(200);

    await request(BASE_URL)
      .get('/app/reports')
      .query({
        branchId: '',
        courseType: '',
        startDate: '',
        endDate: '',
      })
      .set('Cookie', ownerCookie)
      .expect(200);
  });
});

export {};
