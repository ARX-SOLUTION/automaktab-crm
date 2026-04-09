import { ApiProperty } from '@nestjs/swagger';

class RevenueByBranchItemResponse {
  @ApiProperty()
  branchId: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  debt: number;

  @ApiProperty()
  studentCount: number;
}

class RevenueByCourseTypeItemResponse {
  @ApiProperty()
  courseType: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  debt: number;

  @ApiProperty()
  studentCount: number;
}

export class RevenueReportResponse {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalDebt: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty({ type: [RevenueByBranchItemResponse] })
  byBranch: RevenueByBranchItemResponse[];

  @ApiProperty({ type: [RevenueByCourseTypeItemResponse] })
  byCourseType: RevenueByCourseTypeItemResponse[];
}
