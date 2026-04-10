import { Injectable } from '@nestjs/common';

import { TemplateService, TemplateUserContext } from '@infra/templates';

import { BranchesService } from '../branches';
import { GroupsService } from '../groups';
import { ReportsService } from '../reports';
import { StudentsService } from '../students';
import { UsersService } from '../users';
import {
  SsrBaseQueryDto,
  SsrDashboardQueryDto,
  SsrGroupsQueryDto,
  SsrManagersQueryDto,
  SsrReportsQueryDto,
  SsrStudentsQueryDto,
} from './dto';

@Injectable()
export class PagesService {
  constructor(
    private readonly templates: TemplateService,
    private readonly studentsService: StudentsService,
    private readonly branchesService: BranchesService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly reportsService: ReportsService,
  ) {}

  renderLogin(error?: string) {
    return this.templates.render('login', {
      title: 'Kirish',
      pageTitle: 'Kirish',
      pageDescription: 'Auto Test CRM tizimiga kirib, filial va talabalarni boshqaring.',
      currentPage: 'login',
      pageScript: 'auth',
      error: this.resolveLoginError(error),
    });
  }

  async renderDashboard(user: TemplateUserContext, query: SsrDashboardQueryDto) {
    const branches = await this.branchesService.findAll(user);
    const stats = await this.studentsService.getDashboardStats(user, query);

    return this.templates.render('dashboard', {
      title: 'Dashboard',
      pageTitle: "Umumiy ko'rinish",
      pageDescription:
        "Bugungi ko'rsatkichlar, filiallar kesimidagi holat va tezkor boshqaruv uchun umumiy panel.",
      currentPage: 'dashboard',
      pageScript: 'dashboard',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
      branchNames: branches.map((branch) => branch.name).join(', '),
      filters: {
        branchId: query.branchId,
        status: query.status,
        search: query.search,
        courseType: query.courseType,
      },
      stats: {
        ...stats,
        branchCount: branches.length,
        branchDebt: stats.totalDebt,
      },
      flash: this.resolveFlash(query),
    });
  }

  async renderStudents(user: TemplateUserContext, query: SsrStudentsQueryDto) {
    const [result, branches, groups] = await Promise.all([
      this.studentsService.findAllForSsr(
        {
          page: query.page,
          limit: query.limit,
          branchId: query.branchId,
          search: query.search,
          courseType: query.courseType,
          status: query.status,
        },
        user,
      ),
      this.branchesService.findAll(user),
      this.groupsService.findAll({}, user),
    ]);
    const summary = this.studentsService.calculateSummary(result.students);

    return this.templates.render('students', {
      title: 'Talabalar',
      pageTitle: "Talabalar ro'yxati",
      pageDescription:
        "Tezkor va to'liq kurs talabalari, to'lovlar holati hamda amaliy boshqaruv bir joyda.",
      currentPage: 'students',
      pageScript: 'students',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        branchId: group.branchId,
        branchName: group.branchName,
      })),
      students: result.students,
      meta: result.meta,
      summary,
      filters: {
        branchId: user.isManager ? user.branchId ?? undefined : query.branchId,
        status: query.status,
        search: query.search,
        courseType: query.courseType,
      },
      stats: {
        paidCount: result.students.filter((student) => student.debt <= 0).length,
        debtCount: result.students.filter((student) => student.debt > 0).length,
      },
      flash: this.resolveFlash(query),
    });
  }

  async renderBranches(user: TemplateUserContext, query: SsrBaseQueryDto) {
    const branches = await this.branchesService.findAll(user);

    return this.templates.render('branches', {
      title: 'Filiallar',
      pageTitle: 'Filiallar',
      pageDescription: "Filial ma'lumotlarini yangilang va yangi filiallarni boshqaruv tizimiga qo'shing.",
      currentPage: 'branches',
      pageScript: 'branches',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches,
      flash: this.resolveFlash(query),
    });
  }

  async renderManagers(user: TemplateUserContext, query: SsrManagersQueryDto) {
    const [branches, managers] = await Promise.all([
      this.branchesService.findAll(user),
      this.usersService.findAll({
        branchId: query.branchId,
        search: query.search,
        status: query.status,
      }),
    ]);

    return this.templates.render('managers', {
      title: 'Operatorlar',
      pageTitle: 'Operatorlar',
      pageDescription:
        "Har bir filial operatorini nazorat qiling, kontaktlarini yangilang va hisoblarini boshqaring.",
      currentPage: 'managers',
      pageScript: 'managers',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
      managers,
      filters: {
        branchId: query.branchId,
        search: query.search,
        status: query.status,
      },
      flash: this.resolveFlash(query),
    });
  }

  async renderReports(user: TemplateUserContext, query: SsrReportsQueryDto) {
    const [branches, revenue] = await Promise.all([
      this.branchesService.findAll(user),
      this.reportsService.getRevenue({
        branchId: query.branchId,
        courseType: query.courseType,
        startDate: query.startDate,
        endDate: query.endDate,
      }),
    ]);

    return this.templates.render('reports', {
      title: 'Hisobotlar',
      pageTitle: 'Hisobotlar',
      pageDescription:
        "Filiallar bo'yicha tushum, qarzdorlik va kurs kesimidagi moliyaviy ko'rsatkichlarni kuzating.",
      currentPage: 'reports',
      pageScript: 'reports',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
      filters: {
        branchId: query.branchId,
        courseType: query.courseType,
        startDate: query.startDate?.toISOString().slice(0, 10),
        endDate: query.endDate?.toISOString().slice(0, 10),
      },
      revenue,
      flash: this.resolveFlash(query),
    });
  }

  async renderGroupsOverview(user: TemplateUserContext, query: SsrGroupsQueryDto) {
    const [branches, overview, groups] = await Promise.all([
      this.branchesService.findAll(user),
      this.groupsService.getOverview(),
      this.groupsService.findAll(
        {
          branchId: query.branchId,
          search: query.search,
        },
        user,
      ),
    ]);

    const filteredOverview = overview
      .filter((item) => !query.branchId || item.branch.id === query.branchId)
      .map((item) => ({
        ...item,
        groups: query.search
          ? item.groups.filter((group) =>
              group.name.toLocaleLowerCase('uz-UZ').includes(query.search!.toLocaleLowerCase('uz-UZ')),
            )
          : item.groups,
      }))
      .filter((item) => item.groups.length > 0 || (!query.search && !query.branchId));

    return this.templates.render('groups-overview', {
      title: 'Guruhlar',
      pageTitle: 'Guruhlar',
      pageDescription:
        "Filiallar kesimidagi guruhlar holati va ularning faol talabalar sonini tez ko'ring.",
      currentPage: 'groups',
      pageScript: 'groups',
      user,
      isOwner: user.isOwner,
      isManager: user.isManager,
      branchCount: branches.length,
      branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
      overview: filteredOverview,
      groups,
      filters: {
        branchId: query.branchId,
        search: query.search,
      },
      flash: this.resolveFlash(query),
    });
  }

  private resolveLoginError(error?: string): string | undefined {
    if (error === 'invalid') {
      return "Telefon yoki parol noto'g'ri";
    }

    if (error === 'expired') {
      return 'Sessiya muddati tugadi, qayta kiring';
    }

    return undefined;
  }

  private resolveFlash(query: SsrBaseQueryDto): { success?: string; error?: string } | undefined {
    const success = this.resolveSuccessMessage(query.success);
    const error = query.error ? decodeURIComponent(query.error) : undefined;

    if (!success && !error) {
      return undefined;
    }

    return {
      ...(success ? { success } : {}),
      ...(error ? { error } : {}),
    };
  }

  private resolveSuccessMessage(code?: string): string | undefined {
    const successMap: Record<string, string> = {
      created: 'Yangi yozuv muvaffaqiyatli yaratildi',
      updated: "Ma'lumotlar yangilandi",
      deleted: "Yozuv o'chirildi",
      paid: "To'lov yangilandi",
      reset: 'Parol yangilandi',
      deactivated: 'Hisob deaktivatsiya qilindi',
    };

    if (!code) {
      return undefined;
    }

    return successMap[code] ?? decodeURIComponent(code);
  }
}
