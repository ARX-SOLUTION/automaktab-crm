import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUserPayload } from '@common/types';
import { CurrentUser, Roles } from '@core/decorators';
import { RolesGuard } from '@core/guards';

import { Role } from '@prisma/client';

import { BranchesService } from './branches.service';
import { BranchResponse, CreateBranchDto, UpdateBranchDto } from './dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List branches for owner or current manager branch' })
  @ApiResponse({ status: 200, type: [BranchResponse] })
  findAll(@CurrentUser() user: CurrentUserPayload): Promise<BranchResponse[]> {
    return this.branchesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single branch with role-based access' })
  @ApiResponse({ status: 200, type: BranchResponse })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BranchResponse> {
    return this.branchesService.findOne(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Create a branch (owner only)' })
  @ApiResponse({ status: 201, type: BranchResponse })
  create(@Body() dto: CreateBranchDto): Promise<BranchResponse> {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Update a branch (owner only)' })
  @ApiResponse({ status: 200, type: BranchResponse })
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto): Promise<BranchResponse> {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a branch (owner only)' })
  @ApiResponse({ status: 204, description: 'Branch deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.branchesService.remove(id);
  }
}
