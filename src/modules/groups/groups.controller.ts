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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUserPayload } from '@common/types';
import { CurrentUser, Roles } from '@core/decorators';
import { RolesGuard } from '@core/guards';

import { Role } from '@prisma/client';

import {
  CreateGroupDto,
  GetGroupsQueryDto,
  GroupOverviewResponse,
  GroupResponse,
  UpdateGroupDto,
} from './dto';
import { GroupsService } from './groups.service';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Create a group (owner only)' })
  @ApiResponse({ status: 201, type: GroupResponse })
  create(@Body() dto: CreateGroupDto): Promise<GroupResponse> {
    return this.groupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups with branch isolation' })
  @ApiResponse({ status: 200, type: [GroupResponse] })
  findAll(
    @Query() query: GetGroupsQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<GroupResponse[]> {
    return this.groupsService.findAll(query, currentUser);
  }

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Groups overview by branch (owner only)' })
  @ApiResponse({ status: 200, type: [GroupOverviewResponse] })
  getOverview(): Promise<GroupOverviewResponse[]> {
    return this.groupsService.getOverview();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single group with student count' })
  @ApiResponse({ status: 200, type: GroupResponse })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<GroupResponse> {
    return this.groupsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Update a group (owner only)' })
  @ApiResponse({ status: 200, type: GroupResponse })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto): Promise<GroupResponse> {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an empty group (owner only)' })
  @ApiResponse({ status: 204, description: 'Group deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.remove(id);
  }
}
