import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { CurrentUser, Public, Roles, SkipResponseWrapper } from '@core/decorators';
import { SsrAuthGuard, SsrRolesGuard } from '@core/guards';
import { TemplateUserContext } from '@infra/templates';

import { Role } from '@prisma/client';

import { AuthService, LoginDto } from '../auth';
import { CreateBranchDto, UpdateBranchDto } from '../branches';
import { CreateGroupDto, UpdateGroupDto } from '../groups';
import { CreateStudentDto, UpdatePaymentDto, UpdateStudentDto } from '../students';
import { CreateUserDto, ResetUserPasswordDto, UpdateUserDto } from '../users';
import {
  SsrBaseQueryDto,
  SsrDashboardQueryDto,
  SsrManagersQueryDto,
  SsrReportsQueryDto,
  SsrStudentsQueryDto,
} from './dto';
import { PagesService } from './pages.service';
import { BranchesService } from '../branches';
import { GroupsService } from '../groups';
import { StudentsService } from '../students';
import { UsersService } from '../users';

@Public()
@SkipResponseWrapper()
@Controller()
export class PagesController {
  constructor(
    private readonly authService: AuthService,
    private readonly pagesService: PagesService,
    private readonly studentsService: StudentsService,
    private readonly branchesService: BranchesService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Get()
  root(@Res() res: Response): void {
    res.redirect(302, '/app/dashboard');
  }

  @Get('app')
  appRoot(@Res() res: Response): void {
    res.redirect(302, '/app/dashboard');
  }

  @Get('app/login')
  async loginPage(
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderLogin(error));
  }

  @Post('app/login')
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<void> {
    try {
      const { token, user } = await this.authService.loginForSsr(dto);

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: this.authService.getAccessTokenMaxAgeMs(),
      });

      res.redirect(302, user.role === Role.owner ? '/app/dashboard' : '/app/students');
    } catch {
      res.redirect(302, '/app/login?error=invalid');
    }
  }

  @Post('app/logout')
  logout(@Res() res: Response): void {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.redirect(302, '/app/login');
  }

  @UseGuards(SsrAuthGuard)
  @Get('app/dashboard')
  async dashboard(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrDashboardQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderDashboard(user, query));
  }

  @UseGuards(SsrAuthGuard)
  @Get('app/students')
  async students(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrStudentsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const safeQuery = {
      ...query,
      ...(user.role === Role.manager ? { branchId: user.branchId ?? undefined } : {}),
    };

    res.type('html').send(await this.pagesService.renderStudents(user, safeQuery));
  }

  @UseGuards(SsrAuthGuard)
  @Post('app/students')
  async createStudent(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: TemplateUserContext,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.studentsService.create(dto, user);
      res.redirect(302, '/app/students?success=created');
    } catch (error) {
      this.redirectWithError(res, '/app/students', error);
    }
  }

  @UseGuards(SsrAuthGuard)
  @Post('app/students/:id/update')
  async updateStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: TemplateUserContext,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.studentsService.update(id, dto, user);
      res.redirect(302, '/app/students?success=updated');
    } catch (error) {
      this.redirectWithError(res, '/app/students', error);
    }
  }

  @UseGuards(SsrAuthGuard)
  @Post('app/students/:id/payment')
  async updateStudentPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: TemplateUserContext,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.studentsService.updatePayment(id, dto, user);
      res.redirect(302, '/app/students?success=paid');
    } catch (error) {
      this.redirectWithError(res, '/app/students', error);
    }
  }

  @UseGuards(SsrAuthGuard)
  @Post('app/students/:id/delete')
  async deleteStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: TemplateUserContext,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.studentsService.remove(id, user);
      res.redirect(302, '/app/students?success=deleted');
    } catch (error) {
      this.redirectWithError(res, '/app/students', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Get('app/branches')
  async branches(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrBaseQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderBranches(user, query));
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/branches')
  async createBranch(@Body() dto: CreateBranchDto, @Res() res: Response): Promise<void> {
    try {
      await this.branchesService.create(dto);
      res.redirect(302, '/app/branches?success=created');
    } catch (error) {
      this.redirectWithError(res, '/app/branches', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/branches/:id/update')
  async updateBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.branchesService.update(id, dto);
      res.redirect(302, '/app/branches?success=updated');
    } catch (error) {
      this.redirectWithError(res, '/app/branches', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/branches/:id/delete')
  async deleteBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.branchesService.remove(id);
      res.redirect(302, '/app/branches?success=deleted');
    } catch (error) {
      this.redirectWithError(res, '/app/branches', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Get('app/managers')
  async managers(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrManagersQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderManagers(user, query));
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/managers')
  async createManager(@Body() dto: CreateUserDto, @Res() res: Response): Promise<void> {
    try {
      await this.usersService.create(dto);
      res.redirect(302, '/app/managers?success=created');
    } catch (error) {
      this.redirectWithError(res, '/app/managers', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/managers/:id/update')
  async updateManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.usersService.update(id, dto);
      res.redirect(302, '/app/managers?success=updated');
    } catch (error) {
      this.redirectWithError(res, '/app/managers', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/managers/:id/deactivate')
  async deactivateManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.usersService.deactivate(id);
      res.redirect(302, '/app/managers?success=deactivated');
    } catch (error) {
      this.redirectWithError(res, '/app/managers', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/managers/:id/reset-password')
  async resetManagerPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetUserPasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.usersService.resetPassword(id, dto);
      res.redirect(302, '/app/managers?success=reset');
    } catch (error) {
      this.redirectWithError(res, '/app/managers', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Get('app/reports')
  async reports(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrReportsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderReports(user, query));
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Get('app/groups/overview')
  async groupsOverview(
    @CurrentUser() user: TemplateUserContext,
    @Query() query: SsrBaseQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    res.type('html').send(await this.pagesService.renderGroupsOverview(user, query));
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/groups')
  async createGroup(@Body() dto: CreateGroupDto, @Res() res: Response): Promise<void> {
    try {
      await this.groupsService.create(dto);
      res.redirect(302, '/app/groups/overview?success=created');
    } catch (error) {
      this.redirectWithError(res, '/app/groups/overview', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/groups/:id/update')
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.groupsService.update(id, dto);
      res.redirect(302, '/app/groups/overview?success=updated');
    } catch (error) {
      this.redirectWithError(res, '/app/groups/overview', error);
    }
  }

  @UseGuards(SsrAuthGuard, SsrRolesGuard)
  @Roles(Role.owner)
  @Post('app/groups/:id/delete')
  async deleteGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.groupsService.remove(id);
      res.redirect(302, '/app/groups/overview?success=deleted');
    } catch (error) {
      this.redirectWithError(res, '/app/groups/overview', error);
    }
  }

  private redirectWithError(res: Response, path: string, error: unknown): void {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : encodeURIComponent('Xatolik yuz berdi');
    res.redirect(302, `${path}?error=${message}`);
  }
}
