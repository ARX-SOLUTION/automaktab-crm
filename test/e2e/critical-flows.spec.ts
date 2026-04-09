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

async function login(phone: string, password: string): Promise<string> {
  const response = await request(BASE_URL)
    .post('/auth/login')
    .send({ phone, password })
    .expect(200);

  return (response.body as AuthResponse).accessToken;
}

describe('Critical flows', () => {
  jest.setTimeout(30_000);

  let ownerToken: string;
  let managerToken: string;
  let managerBranchId: string;
  let otherBranchStudentId: string;
  let standardGroupId: string;

  beforeAll(async () => {
    ownerToken = await login(OWNER_PHONE, OWNER_PASSWORD);
    managerToken = await login(MANAGER_PHONE, MANAGER_PASSWORD);

    const managerBranches = await request(BASE_URL)
      .get('/branches')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    managerBranchId = managerBranches.body[0].id;

    const ownerBranches = await request(BASE_URL)
      .get('/branches')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const otherBranch = ownerBranches.body.find((branch: { id: string; name: string }) => branch.id !== managerBranchId);

    const otherStudentResponse = await request(BASE_URL)
      .get('/students')
      .query({ courseType: 'express', branchId: otherBranch.id, limit: 1 })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    otherBranchStudentId = otherStudentResponse.body.data[0].id;

    const groupsResponse = await request(BASE_URL)
      .get('/groups')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
    standardGroupId = groupsResponse.body[0].id;
  });

  it('keeps health public and protects auth/me', async () => {
    await request(BASE_URL).get('/health').expect(200);
    await request(BASE_URL).get('/auth/me').expect(401);
  });

  it('returns a minimal JWT payload through auth/me', async () => {
    const response = await request(BASE_URL)
      .get('/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      role: 'owner',
      branchId: null,
    });
  });

  it('blocks manager access to reports and user management', async () => {
    await request(BASE_URL)
      .get('/reports/revenue')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);

    await request(BASE_URL)
      .post('/users')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        fullName: 'Blocked Manager',
        phone: uniquePhone('+998981'),
        password: 'manager123',
        branchId: managerBranchId,
      })
      .expect(403);
  });

  it('prevents a manager from reading another branch student', async () => {
    await request(BASE_URL)
      .get(`/students/${otherBranchStudentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);

    await request(BASE_URL)
      .patch(`/students/${otherBranchStudentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ notes: 'forbidden' })
      .expect(403);
  });

  it('handles the express flow: create, pay to zero, reject extra payment, delete', async () => {
    const phone = uniquePhone('+998982');
    const createResponse = await request(BASE_URL)
      .post('/students')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        firstName: 'Flow',
        lastName: 'Express',
        phone,
        courseType: 'express',
        totalPrice: 650000,
        amountPaid: 200000,
      })
      .expect(201);

    expect(createResponse.body.branch.id).toBe(managerBranchId);
    expect(createResponse.body.debt).toBe(450000);

    const studentId = createResponse.body.id;
    const paidResponse = await request(BASE_URL)
      .patch(`/students/${studentId}/payment`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ amountPaid: 650000 })
      .expect(200);

    expect(paidResponse.body.debt).toBe(0);
    expect(paidResponse.body.paymentStatus).toBe('paid');

    await request(BASE_URL)
      .patch(`/students/${studentId}/payment`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ amountPaid: 650000 })
      .expect(400);

    await request(BASE_URL)
      .delete(`/students/${studentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(204);

    await request(BASE_URL)
      .get(`/students/${studentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(404);
  });

  it('handles the standard flow: create, patch installments, read payment history', async () => {
    const phone = uniquePhone('+998983');
    const createResponse = await request(BASE_URL)
      .post('/students')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        firstName: 'Flow',
        lastName: 'Standard',
        phone,
        courseType: 'standard',
        totalPrice: 6000000,
        initialPayment: 1000000,
        groupId: standardGroupId,
      })
      .expect(201);

    expect(createResponse.body.debt).toBe(5000000);

    const studentId = createResponse.body.id;
    const patchResponse = await request(BASE_URL)
      .patch(`/students/${studentId}/payment`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ secondPayment: 200000, thirdPayment: 400000 })
      .expect(200);

    expect(patchResponse.body.debt).toBe(4400000);
    expect(patchResponse.body.installments).toEqual({
      initialPayment: 1000000,
      secondPayment: 200000,
      thirdPayment: 400000,
    });

    const historyResponse = await request(BASE_URL)
      .get(`/students/${studentId}/payment-history`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);

    expect(historyResponse.body.length).toBeGreaterThanOrEqual(2);
  });
});
