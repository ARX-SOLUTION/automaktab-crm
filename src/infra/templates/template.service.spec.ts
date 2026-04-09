import { TemplateService } from './template.service';
import { DashboardPageContext, StudentsPageContext, TemplateUserContext } from './types';

describe('TemplateService', () => {
  let service: TemplateService;

  const ownerUser: TemplateUserContext = {
    id: 'owner-id',
    role: 'owner',
    branchId: null,
    fullName: 'Admin Boss',
    branchName: null,
    isOwner: true,
    isManager: false,
  };

  beforeEach(() => {
    service = new TemplateService();
  });

  it('renders students page with expected table headers and summary rows', async () => {
    const context: StudentsPageContext = {
      title: 'Talabalar',
      pageTitle: "Talabalar ro'yxati",
      currentPage: 'students',
      pageScript: 'students',
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      students: [
        {
          id: 'student-1',
          firstName: 'Ali',
          lastName: 'Valiyev',
          phone: '+998901234567',
          courseType: 'standard',
          status: 'active',
          totalPrice: 6000000,
          debt: 2500000,
          paymentMethod: 'cash',
          hasDocument: false,
          result: 'pending',
          notes: null,
          contractNumber: 'C-101',
          completionDate: null,
          o83: false,
          paymentStatus: 'partial',
          createdAt: new Date(),
          updatedAt: new Date(),
          branch: { id: 'branch-1', name: 'Minor' },
          group: { id: 'group-1', name: 'B-1' },
          registrar: { id: 'manager-1', fullName: 'Minor Manager' },
          initialPayment: 2000000,
          secondPayment: 1000000,
          thirdPayment: 500000,
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      summary: {
        totalPrices: 6000000,
        totalInitial: 2000000,
        totalSecond: 1000000,
        totalThird: 500000,
        totalPaid: 3500000,
        totalDebt: 2500000,
      },
      filters: {},
      stats: {
        paidCount: 0,
        debtCount: 1,
      },
      flash: undefined,
    };

    const html = await service.render('students', context);

    expect(html).toContain('<th>F.I.SH</th>');
    expect(html).toContain('<th>Qoldiq</th>');
    expect(html).toContain('<th>Amallar</th>');
    expect(html).toContain("JAMI NATIJA");
    expect(html).toContain("✅ JAMI TO'LANGAN");
    expect(html).toContain("❌ JAMI QOLDIQ (QARZDORLIK)");
    expect(html).toContain('soʻm');
  });

  it('renders manager branch filter with own branch only', async () => {
    const context: DashboardPageContext = {
      title: 'Dashboard',
      pageTitle: "Umumiy ko'rinish",
      currentPage: 'dashboard',
      pageScript: 'dashboard',
      user: {
        ...ownerUser,
        role: 'manager',
        branchId: 'branch-1',
        branchName: 'Minor',
        isOwner: false,
        isManager: true,
      },
      isOwner: false,
      isManager: true,
      branchCount: 1,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      branchNames: 'Minor',
      filters: {},
      stats: {
        totalStudents: 10,
        paidCount: 4,
        debtCount: 6,
        totalPaid: 1000000,
        totalDebt: 2000000,
        branchDebt: 2000000,
        branchCount: 1,
      },
      flash: undefined,
    };

    const html = await service.render('dashboard', context);

    expect(html).toContain('value="branch-1" selected');
    expect(html).not.toContain('Samarqand</option>');
    expect(html).not.toContain('/app/branches');
  });

  it('caches compiled templates', async () => {
    await service.render('login', {
      title: 'Kirish',
      pageTitle: 'Kirish',
      currentPage: 'login',
      pageScript: 'auth',
      error: undefined,
    });

    const firstEntry = (service as unknown as { pageCache: Map<string, { hash: string }> }).pageCache.get('login');

    await service.render('login', {
      title: 'Kirish',
      pageTitle: 'Kirish',
      currentPage: 'login',
      pageScript: 'auth',
      error: undefined,
    });

    const secondEntry = (service as unknown as { pageCache: Map<string, { hash: string }> }).pageCache.get('login');

    expect(firstEntry?.hash).toBeDefined();
    expect(firstEntry?.hash).toBe(secondEntry?.hash);
  });
});
