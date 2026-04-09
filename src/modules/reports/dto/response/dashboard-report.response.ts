import { ApiProperty } from '@nestjs/swagger';

class DashboardByBranchItemResponse {
  @ApiProperty()
  branchId: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  studentCount: number;

  @ApiProperty()
  activeCount: number;
}

class DashboardByCourseTypeItemResponse {
  @ApiProperty()
  courseType: string;

  @ApiProperty()
  studentCount: number;
}

export class DashboardReportResponse {
  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  activeStudents: number;

  @ApiProperty()
  completedStudents: number;

  @ApiProperty()
  droppedStudents: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalDebt: number;

  @ApiProperty({ type: [DashboardByBranchItemResponse] })
  byBranch: DashboardByBranchItemResponse[];

  @ApiProperty({ type: [DashboardByCourseTypeItemResponse] })
  byCourseType: DashboardByCourseTypeItemResponse[];
}
