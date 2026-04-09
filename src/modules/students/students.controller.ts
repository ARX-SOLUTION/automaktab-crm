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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUserPayload } from '@common/types';
import { CurrentUser } from '@core/decorators';

import {
  CreateStudentDto,
  GetStudentsQueryDto,
  PaymentLogResponse,
  StudentResponse,
  UpdatePaymentDto,
  UpdateStudentDto,
} from './dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create student' })
  @ApiResponse({ status: 201, type: StudentResponse })
  create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    return this.studentsService.create(dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'List students with branch isolation' })
  findAll(@Query() query: GetStudentsQueryDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.studentsService.findAll(query, currentUser);
  }

  @Get(':id/payment-history')
  @ApiOperation({ summary: 'Get student payment history' })
  @ApiResponse({ status: 200, type: PaymentLogResponse, isArray: true })
  getPaymentHistory(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<PaymentLogResponse[]> {
    return this.studentsService.getPaymentHistory(id, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single student with branch isolation' })
  @ApiResponse({ status: 200, type: StudentResponse })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    return this.studentsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student' })
  @ApiResponse({ status: 200, type: StudentResponse })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, dto, currentUser);
  }

  @Patch(':id/payment')
  @ApiOperation({ summary: 'Update student payment' })
  @ApiResponse({ status: 200, type: StudentResponse })
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<StudentResponse> {
    return this.studentsService.updatePayment(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete student' })
  @ApiResponse({ status: 204, description: 'Student deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<void> {
    await this.studentsService.remove(id, currentUser);
  }
}
