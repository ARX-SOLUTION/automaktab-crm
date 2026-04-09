import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@core/decorators';
import { RolesGuard } from '@core/guards';

import { Role } from '@prisma/client';

import {
  DashboardReportResponse,
  GetRevenueQueryDto,
  RevenueReportResponse,
} from './dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.owner)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report (owner only)' })
  @ApiResponse({ status: 200, type: RevenueReportResponse })
  getRevenue(@Query() query: GetRevenueQueryDto): Promise<RevenueReportResponse> {
    return this.reportsService.getRevenue(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard report (owner only)' })
  @ApiResponse({ status: 200, type: DashboardReportResponse })
  getDashboard(): Promise<DashboardReportResponse> {
    return this.reportsService.getDashboard();
  }
}
