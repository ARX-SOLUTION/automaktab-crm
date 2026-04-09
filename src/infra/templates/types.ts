import { PaginationMetaDto } from '@common/dto';
import { CurrentUserPayload } from '@common/types';

import { BranchResponse } from '@/modules/branches';
import { GroupOverviewResponse, GroupResponse } from '@/modules/groups';
import { RevenueReportResponse } from '@/modules/reports';
import { StudentResponse } from '@/modules/students';
import { UserResponse } from '@/modules/users';

export type TemplatePageName =
  | 'login'
  | 'dashboard'
  | 'students'
  | 'branches'
  | 'managers'
  | 'reports'
  | 'groups-overview';

export interface TemplateUserContext extends CurrentUserPayload {
  fullName: string;
  branchName: string | null;
  isOwner: boolean;
  isManager: boolean;
}

export interface PageFlashContext {
  success?: string;
  error?: string;
}

export interface PageFilterContext {
  branchId?: string;
  status?: string;
  search?: string;
  courseType?: string;
  startDate?: string;
  endDate?: string;
}

export interface PageMetaContext {
  title: string;
  pageTitle: string;
  currentPage: string;
  pageScript?: string;
  user?: TemplateUserContext;
  isOwner?: boolean;
  isManager?: boolean;
  branchCount?: number;
  flash?: PageFlashContext;
}

export interface LoginPageContext extends PageMetaContext {
  error?: string;
}

export interface DashboardStatsContext {
  totalStudents: number;
  paidCount: number;
  debtCount: number;
  totalPaid: number;
  totalDebt: number;
  branchDebt: number;
  branchCount: number;
}

export interface DashboardPageContext extends PageMetaContext {
  user: TemplateUserContext;
  branches: Array<Pick<BranchResponse, 'id' | 'name'>>;
  branchNames: string;
  filters: PageFilterContext;
  stats: DashboardStatsContext;
}

export interface StudentsSummaryContext {
  totalPrices: number;
  totalInitial: number;
  totalSecond: number;
  totalThird: number;
  totalPaid: number;
  totalDebt: number;
}

export interface StudentRowContext extends Omit<StudentResponse, 'installments' | 'amountPaid'> {
  initialPayment: number;
  secondPayment: number;
  thirdPayment: number;
}

export interface StudentsPageContext extends PageMetaContext {
  user: TemplateUserContext;
  branches: Array<Pick<BranchResponse, 'id' | 'name'>>;
  students: StudentRowContext[];
  meta: PaginationMetaDto;
  summary: StudentsSummaryContext;
  filters: PageFilterContext;
  stats: Pick<DashboardStatsContext, 'paidCount' | 'debtCount'>;
}

export interface BranchesPageContext extends PageMetaContext {
  user: TemplateUserContext;
  branches: BranchResponse[];
}

export interface ManagersPageContext extends PageMetaContext {
  user: TemplateUserContext;
  managers: UserResponse[];
  branches: Array<Pick<BranchResponse, 'id' | 'name'>>;
  filters: PageFilterContext;
}

export interface ReportsPageContext extends PageMetaContext {
  user: TemplateUserContext;
  branches: Array<Pick<BranchResponse, 'id' | 'name'>>;
  filters: PageFilterContext;
  revenue: RevenueReportResponse;
}

export interface GroupsOverviewPageContext extends PageMetaContext {
  user: TemplateUserContext;
  branches: Array<Pick<BranchResponse, 'id' | 'name'>>;
  overview: GroupOverviewResponse[];
  groups: GroupResponse[];
}

export interface PageContextMap {
  login: LoginPageContext;
  dashboard: DashboardPageContext;
  students: StudentsPageContext;
  branches: BranchesPageContext;
  managers: ManagersPageContext;
  reports: ReportsPageContext;
  'groups-overview': GroupsOverviewPageContext;
}
