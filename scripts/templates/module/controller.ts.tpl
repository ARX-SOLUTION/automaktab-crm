import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUserPayload } from '@common/types';
import { CurrentUser, Roles } from '@core/decorators';
import { RolesGuard } from '@core/guards';
import { Role } from '@prisma/client';

import {
  Create{{PascalSingular}}Dto,
  Get{{PascalPlural}}QueryDto,
  Update{{PascalSingular}}Dto,
  {{PascalSingular}}Response,
} from './dto';
import { {{PascalPlural}}Service } from './{{kebabPlural}}.service';

@ApiTags('{{PascalPlural}}')
@ApiBearerAuth()
@Controller('{{kebabPlural}}')
export class {{PascalPlural}}Controller {
  constructor(private readonly {{camelPlural}}Service: {{PascalPlural}}Service) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Get all {{camelPlural}}' })
  @ApiResponse({ status: 200, description: 'List of {{camelPlural}}' })
  async findAll(@Query() query: Get{{PascalPlural}}QueryDto) {
    const { data, meta } = await this.{{camelPlural}}Service.findAll(query);
    return {
      data: data.map({{PascalSingular}}Response.fromEntity),
      meta,
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Create a new {{camelSingular}}' })
  @ApiResponse({ status: 201, description: '{{PascalSingular}} created' })
  async create(
    @Body() dto: Create{{PascalSingular}}Dto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    const {{camelSingular}} = await this.{{camelPlural}}Service.create(dto, currentUser);
    return {{PascalSingular}}Response.fromEntity({{camelSingular}});
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Get {{camelSingular}} by ID' })
  @ApiResponse({ status: 200, description: '{{PascalSingular}} found' })
  @ApiResponse({ status: 404, description: '{{PascalSingular}} not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const {{camelSingular}} = await this.{{camelPlural}}Service.findById(id);
    return {{PascalSingular}}Response.fromEntity({{camelSingular}});
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Update {{camelSingular}}' })
  @ApiResponse({ status: 200, description: '{{PascalSingular}} updated' })
  @ApiResponse({ status: 404, description: '{{PascalSingular}} not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Update{{PascalSingular}}Dto,
  ) {
    const {{camelSingular}} = await this.{{camelPlural}}Service.update(id, dto);
    return {{PascalSingular}}Response.fromEntity({{camelSingular}});
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete {{camelSingular}}' })
  @ApiResponse({ status: 204, description: '{{PascalSingular}} deleted' })
  @ApiResponse({ status: 404, description: '{{PascalSingular}} not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.{{camelPlural}}Service.delete(id);
  }
}
