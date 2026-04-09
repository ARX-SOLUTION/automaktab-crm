import { Injectable } from '@nestjs/common';

import { PrismaService } from '@infra/prisma';

import { CourseType, Prisma, StudentStatus } from '@prisma/client';

import {
  DashboardReportResponse,
  GetRevenueQueryDto,
  RevenueReportResponse,
} from './dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(query: GetRevenueQueryDto): Promise<RevenueReportResponse> {
    const students = await this.prisma.student.findMany({
      where: this.buildRevenueWhere(query),
      select: this.reportStudentSelect,
    });

    const byBranchMap = new Map<
      string,
      { branchId: string; branchName: string; revenue: number; debt: number; studentCount: number }
    >();
    const byCourseTypeMap = new Map<
      CourseType,
      { courseType: CourseType; revenue: number; debt: number; studentCount: number }
    >();

    let totalRevenue = 0;
    let totalDebt = 0;

    for (const student of students) {
      const debt = Number(student.debt);
      const revenue = Number(student.totalPrice) - debt;

      totalRevenue += revenue;
      totalDebt += debt;

      const branchSummary = byBranchMap.get(student.branchId) ?? {
        branchId: student.branch.id,
        branchName: student.branch.name,
        revenue: 0,
        debt: 0,
        studentCount: 0,
      };
      branchSummary.revenue += revenue;
      branchSummary.debt += debt;
      branchSummary.studentCount += 1;
      byBranchMap.set(student.branchId, branchSummary);

      const courseTypeSummary = byCourseTypeMap.get(student.courseType) ?? {
        courseType: student.courseType,
        revenue: 0,
        debt: 0,
        studentCount: 0,
      };
      courseTypeSummary.revenue += revenue;
      courseTypeSummary.debt += debt;
      courseTypeSummary.studentCount += 1;
      byCourseTypeMap.set(student.courseType, courseTypeSummary);
    }

    return {
      totalRevenue,
      totalDebt,
      totalStudents: students.length,
      byBranch: Array.from(byBranchMap.values()).sort((left, right) =>
        left.branchName.localeCompare(right.branchName),
      ),
      byCourseType: Array.from(byCourseTypeMap.values()).sort((left, right) =>
        left.courseType.localeCompare(right.courseType),
      ),
    };
  }

  async getDashboard(): Promise<DashboardReportResponse> {
    const students = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
      },
      select: this.reportStudentSelect,
    });

    const byBranchMap = new Map<
      string,
      { branchId: string; branchName: string; studentCount: number; activeCount: number }
    >();
    const byCourseTypeMap = new Map<CourseType, { courseType: CourseType; studentCount: number }>();

    let totalRevenue = 0;
    let totalDebt = 0;
    let activeStudents = 0;
    let completedStudents = 0;
    let droppedStudents = 0;

    for (const student of students) {
      const debt = Number(student.debt);
      const revenue = Number(student.totalPrice) - debt;

      totalRevenue += revenue;
      totalDebt += debt;

      if (student.status === StudentStatus.active) {
        activeStudents += 1;
      }

      if (student.status === StudentStatus.completed) {
        completedStudents += 1;
      }

      if (student.status === StudentStatus.dropped) {
        droppedStudents += 1;
      }

      const branchSummary = byBranchMap.get(student.branchId) ?? {
        branchId: student.branch.id,
        branchName: student.branch.name,
        studentCount: 0,
        activeCount: 0,
      };
      branchSummary.studentCount += 1;
      if (student.status === StudentStatus.active) {
        branchSummary.activeCount += 1;
      }
      byBranchMap.set(student.branchId, branchSummary);

      const courseTypeSummary = byCourseTypeMap.get(student.courseType) ?? {
        courseType: student.courseType,
        studentCount: 0,
      };
      courseTypeSummary.studentCount += 1;
      byCourseTypeMap.set(student.courseType, courseTypeSummary);
    }

    return {
      totalStudents: students.length,
      activeStudents,
      completedStudents,
      droppedStudents,
      totalRevenue,
      totalDebt,
      byBranch: Array.from(byBranchMap.values()).sort((left, right) =>
        left.branchName.localeCompare(right.branchName),
      ),
      byCourseType: Array.from(byCourseTypeMap.values()).sort((left, right) =>
        left.courseType.localeCompare(right.courseType),
      ),
    };
  }

  private buildRevenueWhere(query: GetRevenueQueryDto): Prisma.StudentWhereInput {
    const createdAt =
      query.startDate || query.endDate
        ? {
            ...(query.startDate ? { gte: query.startDate } : {}),
            ...(query.endDate ? { lte: query.endDate } : {}),
          }
        : undefined;

    return {
      deletedAt: null,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.courseType ? { courseType: query.courseType } : {}),
      ...(createdAt ? { createdAt } : {}),
    };
  }

  private readonly reportStudentSelect = {
    branchId: true,
    courseType: true,
    debt: true,
    totalPrice: true,
    status: true,
    branch: {
      select: {
        id: true,
        name: true,
      },
    },
  } satisfies Prisma.StudentSelect;
}
