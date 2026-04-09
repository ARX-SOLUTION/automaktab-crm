import {
  Body,
  Controller,
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
  CreateUserDto,
  GetUsersQueryDto,
  ResetUserPasswordDto,
  UpdateUserDto,
  UserResponse,
} from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Create manager account' })
  @ApiResponse({ status: 201, type: UserResponse })
  create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'List manager accounts' })
  @ApiResponse({ status: 200, type: [UserResponse] })
  findAll(@Query() query: GetUsersQueryDto): Promise<UserResponse[]> {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponse })
  findMe(@CurrentUser() currentUser: CurrentUserPayload): Promise<UserResponse> {
    return this.usersService.findMe(currentUser);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Get single manager account' })
  @ApiResponse({ status: 200, type: UserResponse })
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Update manager account' })
  @ApiResponse({ status: 200, type: UserResponse })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponse> {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @ApiOperation({ summary: 'Deactivate manager account' })
  @ApiResponse({ status: 200, type: UserResponse })
  deactivate(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset manager password' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
  ): Promise<void> {
    await this.usersService.resetPassword(id, dto);
  }
}
