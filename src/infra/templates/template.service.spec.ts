import { TemplateService } from './template.service';
import {
  BranchesPageContext,
  DashboardPageContext,
  GroupsOverviewPageContext,
  ManagersPageContext,
  ReportsPageContext,
  StudentsPageContext,
  TemplateUserContext,
} from './types';

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
      pageDescription: "Talabalar ro'yxati va to'lov holati",
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      groups: [
        { id: 'group-1', name: 'B-1', branchId: 'branch-1', branchName: 'Minor' },
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
    expect(html).toContain("Jami natija");
    expect(html).toContain("Jami to'langan");
    expect(html).toContain("Jami qoldiq");
    expect(html).toContain('soʻm');
  });

  it('renders manager branch filter with own branch only', async () => {
    const context: DashboardPageContext = {
      title: 'Dashboard',
      pageTitle: "Umumiy ko'rinish",
      currentPage: 'dashboard',
      pageScript: 'dashboard',
      pageDescription: "Umumiy ko'rinish",
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

  it('renders owner management pages without template errors', async () => {
    const branchesContext: BranchesPageContext = {
      title: 'Filiallar',
      pageTitle: 'Filiallar',
      currentPage: 'branches',
      pageScript: 'branches',
      pageDescription: "Filiallarni boshqarish",
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        {
          id: 'branch-1',
          name: 'Minor',
          address: 'Yunusobod',
          phone: '+998900000001',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'branch-2',
          name: 'Samarqand',
          address: 'Registon',
          phone: null,
          isActive: true,
          createdAt: new Date(),
        },
      ],
      flash: undefined,
    };

    const managersContext: ManagersPageContext = {
      title: 'Operatorlar',
      pageTitle: 'Operatorlar',
      currentPage: 'managers',
      pageScript: 'managers',
      pageDescription: "Operatorlarni boshqarish",
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      managers: [
        {
          id: 'manager-1',
          fullName: 'Minor Manager',
          phone: '+998901111111',
          role: 'manager',
          branchId: 'branch-1',
          branchName: 'Minor',
          isActive: true,
          createdAt: new Date(),
        },
      ],
      filters: {},
      flash: undefined,
    };

    const reportsContext: ReportsPageContext = {
      title: 'Hisobotlar',
      pageTitle: 'Hisobotlar',
      currentPage: 'reports',
      pageScript: 'reports',
      pageDescription: "Moliyaviy hisobotlar",
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      filters: {},
      revenue: {
        totalRevenue: 12000000,
        totalDebt: 3000000,
        totalStudents: 18,
        byBranch: [
          {
            branchId: 'branch-1',
            branchName: 'Minor',
            revenue: 7000000,
            debt: 1000000,
            studentCount: 10,
          },
        ],
        byCourseType: [
          {
            courseType: 'express',
            revenue: 5000000,
            debt: 500000,
            studentCount: 8,
          },
        ],
      },
      flash: undefined,
    };

    const groupsContext: GroupsOverviewPageContext = {
      title: 'Guruhlar',
      pageTitle: 'Guruhlar',
      currentPage: 'groups',
      pageScript: 'groups',
      pageDescription: "Guruhlar overview",
      user: ownerUser,
      isOwner: true,
      isManager: false,
      branchCount: 2,
      branches: [
        { id: 'branch-1', name: 'Minor' },
        { id: 'branch-2', name: 'Samarqand' },
      ],
      overview: [
        {
          branch: {
            id: 'branch-1',
            name: 'Minor',
          },
          groups: [
            {
              id: 'group-1',
              name: 'B-12',
              totalStudents: 12,
              activeStudents: 9,
            },
          ],
        },
      ],
      groups: [
        {
          id: 'group-1',
          name: 'B-12',
          branchId: 'branch-1',
          branchName: 'Minor',
          isActive: true,
          totalStudents: 12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      filters: {},
      flash: undefined,
    };

    await expect(service.render('branches', branchesContext)).resolves.toContain('Filiallar jadvali');
    await expect(service.render('managers', managersContext)).resolves.toContain('Operatorlar jadvali');
    await expect(service.render('reports', reportsContext)).resolves.toContain('Kurs turi kesimida ko\'rinish');
    await expect(service.render('groups-overview', groupsContext)).resolves.toContain('Guruhlar jadvali');
  });

  it('caches compiled templates', async () => {
    await service.render('login', {
      title: 'Kirish',
      pageTitle: 'Kirish',
      pageDescription: 'Tizimga kirish',
      currentPage: 'login',
      pageScript: 'auth',
      error: undefined,
    });

    const firstEntry = (service as unknown as { pageCache: Map<string, { hash: string }> }).pageCache.get('login');

    await service.render('login', {
      title: 'Kirish',
      pageTitle: 'Kirish',
      pageDescription: 'Tizimga kirish',
      currentPage: 'login',
      pageScript: 'auth',
      error: undefined,
    });

    const secondEntry = (service as unknown as { pageCache: Map<string, { hash: string }> }).pageCache.get('login');

    expect(firstEntry?.hash).toBeDefined();
    expect(firstEntry?.hash).toBe(secondEntry?.hash);
  });
});
