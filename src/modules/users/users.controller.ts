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
  AdminUpdateUserDto,
  ChangePasswordDto,
  CreateUserDto,
  GetUsersQueryDto,
  RequestEmailChangeDto,
  UpdateUserDto,
  UserResponse,
  VerifyEmailChangeDto,
} from './dto';
import { EmailChangeService } from './email-change.service';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailChangeService: EmailChangeService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated users' })
  findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Create user (Admin only)' })
  @ApiResponse({ status: 201, type: UserResponse })
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.create(dto, currentUser);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserResponse })
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponse })
  updateMe(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/email/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request email change - sends OTP to new email' })
  @ApiResponse({ status: 204, description: 'Verification code sent to new email' })
  requestEmailChange(@CurrentUser() user: CurrentUserPayload, @Body() dto: RequestEmailChangeDto) {
    return this.emailChangeService.requestEmailChange(user.id, dto);
  }

  @Post('me/email/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verify email change with OTP' })
  @ApiResponse({ status: 204, description: 'Email changed successfully' })
  verifyEmailChange(@CurrentUser() user: CurrentUserPayload, @Body() dto: VerifyEmailChangeDto) {
    return this.emailChangeService.verifyEmailChange(user.id, dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, type: UserResponse })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, type: UserResponse })
  update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.usersService.adminUpdate(id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin, Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
