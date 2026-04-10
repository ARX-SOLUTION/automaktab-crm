# Auto Test CRM — AGENTS.md

> Bu fayl Codex uchun loyihaning "miyasi". Har bir sessiyada o'qiladi.
> Barcha qarorlar shu faylga asoslanadi.



NestJS backend for **Auto Test CRM** — a driving school management system with multi-branch architecture, role-based access, student management, installment payment tracking, group management, and course lifecycle.

## Project Context

- **2 course types with different structures:**
  - **Tezkor kurs (Express — 1 week):** Single payment tracking, simple table
  - **Avto maktab kursi (Standard — 2.5 months):** Installment payments (3 stages), group assignment, contract number, completion date, O83 status
- **Multi-branch:** 4+ branches (Minor, Chorsu, Novza, Samarkand) — expandable
- **Only 2 roles:**
  - `owner` (Business Owner) — Full access: all branches, all students, revenue/income reports, manager accounts, groups overview per branch
  - `manager` (Branch Manager) — Own branch only: register students, track payments, manage both course tables. **Cannot see other branches. Cannot see revenue/income.**
- **No student-facing panel.** Only owner and managers operate the system.
- **Core domains:** Branches, Students, Payments, Groups, Reports

## Course Table Structures (from TZ)

### Tezkor kurs (Express — 1 week)

Both owner and manager see this table (manager — own branch only):

| Field | DB Column | Type | Description |
|-------|-----------|------|-------------|
| Familya | `last_name` | String | Student last name |
| Ismi | `first_name` | String | Student first name |
| Telefon | `phone` | String | Phone number |
| Kurs umumiy narxi | `total_price` | Decimal | Total course price |
| To'lov | `amount_paid` | Decimal | Amount paid |
| Qarzdorlik | `debt` | Decimal | Remaining debt (calculated: totalPrice − amountPaid) |
| Tulov turi | `payment_method` | Enum | cash / card / transfer |
| Dakument | `has_document` | Boolean | Document submitted (+ or −) |
| Operator | `registered_by` → User | Relation | Manager who registered the student |
| Natijasi | `result` | Enum | pending / passed / failed |
| Izoh | `notes` | String? | Free text comments |

### Avto maktab kursi (Standard — 2.5 months)

Both owner and manager see this table (manager — own branch only). This course has **installment payments** and additional fields:

| Field | DB Column | Type | Description |
|-------|-----------|------|-------------|
| Familya | `last_name` | String | Student last name |
| Ismi | `first_name` | String | Student first name |
| Telefon | `phone` | String | Phone number |
| Kurs umumiy narxi | `total_price` | Decimal | Total course price (e.g. 6,000,000) |
| Boshlang'ich tulov | `initial_payment` | Decimal | 1st installment |
| 2-tulov | `second_payment` | Decimal | 2nd installment |
| 3-tulov | `third_payment` | Decimal | 3rd installment |
| Qarzdorlik | `debt` | Decimal | Remaining debt (calculated: totalPrice − sum of installments) |
| Tulov turi | `payment_method` | Enum | cash / card / transfer |
| Guruh | `group_id` → Group | Relation | Assigned group (B-1, B-2, etc.) |
| Tugatish sanasi | `completion_date` | DateTime? | Course completion date |
| O83 | `o83` | Boolean | O83 form status (+ or −) |
| Shartnoma raqami | `contract_number` | String? | Contract number (C-201, etc.) |
| Dakument | `has_document` | Boolean | Document submitted (+ or −) |
| Operator | `registered_by` → User | Relation | Manager who registered |
| Natijasi | `result` | Enum | pending / passed / failed |
| Izoh | `notes` | String? | Free text comments |

### Owner-only: Groups per Branch overview

Owner sees a summary of groups assigned to each branch:
```
Avt omact  → 11-guruh
Minor      → 12-guruh
Chorsu     → 13-guruh (24 students)
Novza      → 14-guruh
OtS        → 15-guruh
```

This requires a **Group** model tied to branches, with student count.

## Quick Commands

```bash
pnpm install                 # Install dependencies
pnpm start:dev               # Start development server
pnpm build                   # Build for production
pnpm test                    # Run unit tests
pnpm lint                    # Lint code
pnpm prisma:push             # Push schema to DB (dev)
pnpm prisma:migrate          # Create migration
pnpm prisma:generate         # Generate Prisma client
pnpm prisma:seed             # Seed database
pnpm prisma:studio           # Open Prisma Studio
pnpm generate:module <n>  # Generate CRUD module
```

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── config/                     # Environment config (Zod validation)
├── core/
│   ├── decorators/             # @CurrentUser, @Roles, @Public, @SkipWrapper
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── filters/                # HttpExceptionFilter
│   ├── interceptors/           # ResponseWrapperInterceptor
│   └── middleware/             # CorrelationIdMiddleware
├── infra/
│   ├── prisma/                 # PrismaService
│   ├── logger/                 # Pino logger
│   ├── redis/                  # RedisService, UserCacheService
│   ├── mail/                   # MailService (AWS SES)
│   └── storage/                # StorageService (Cloudflare R2)
├── common/
│   ├── dto/                    # PaginationQueryDto, PaginationMetaDto
│   ├── types/                  # CurrentUserPayload
│   └── exceptions/             # Api*Exception classes
└── modules/
    ├── auth/                   # JWT login
    ├── users/                  # Owner + Manager accounts
    ├── branches/               # Branch CRUD (owner)
    ├── students/               # Student CRUD (both course types)
    ├── groups/                 # Group management (standard course)
    ├── reports/                # Revenue, analytics (owner only)
    ├── upload/                 # File upload
    └── health/                 # Health checks
```

## Module Structure

```
{module}/
├── {module}.module.ts
├── {module}.controller.ts
├── {module}.service.ts
├── dto/
│   ├── request/
│   └── response/
└── index.ts
```

## Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | src/* |
| `@config` | src/config |
| `@modules` | src/modules |
| `@infra/*` | src/infra/* |
| `@common/*` | src/common/* |
| `@core/*` | src/core/* |

## Key Imports

```typescript
import { CurrentUserPayload } from '@common/types';
import { Role, CourseType } from '@prisma/client';
import { CurrentUser, Roles, Public, SkipResponseWrapper } from '@core/decorators';
import { RolesGuard } from '@core/guards';
import { PrismaService } from '@infra/prisma/prisma.service';
import { PaginationQueryDto } from '@common/dto/pagination.dto';
import { ApiBadRequestException, ApiNotFoundException } from '@common/exceptions';
```

## File Naming

| Type | Pattern |
|------|---------|
| Module | `{entity}.module.ts` |
| Controller | `{entity}.controller.ts` |
| Service | `{entity}.service.ts` |
| Create DTO | `create-{entity}.dto.ts` |
| Update DTO | `update-{entity}.dto.ts` |
| Query DTO | `get-{entities}-query.dto.ts` |
| Response | `{entity}.response.ts` |
| Unit Test | `{file}.spec.ts` (co-located) |

## Database Schema

- **Code**: camelCase — **Database**: snake_case — **Tables**: plural snake_case
- **Primary Key**: UUID — **Soft Deletes**: `deletedAt` — **Branch Isolation**: `branchId` with index

```prisma
// ─── Enums ───

enum Role {
  owner
  manager
}

enum CourseType {
  express    // Tezkor kurs (1 week)
  standard   // Avto maktab kursi (2.5 months)
}

enum StudentStatus {
  active
  completed
  dropped
  suspended
}

enum StudentResult {
  pending
  passed
  failed
}

enum PaymentMethod {
  cash
  card
  transfer
}

// ─── Models ───

model User {
  id        String    @id @default(uuid()) @db.Uuid
  fullName  String    @map("full_name")
  phone     String    @unique
  password  String
  role      Role
  branchId  String?   @map("branch_id") @db.Uuid
  branch    Branch?   @relation(fields: [branchId], references: [id])
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  registeredStudents Student[]

  @@index([role])
  @@index([branchId])
  @@index([deletedAt])
  @@map("users")
}

model Branch {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @unique
  address   String
  phone     String?
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  managers  User[]
  students  Student[]
  groups    Group[]

  @@index([deletedAt])
  @@map("branches")
}

model Group {
  id         String     @id @default(uuid()) @db.Uuid
  name       String                                        // "11-guruh", "B-1", etc.
  branchId   String     @map("branch_id") @db.Uuid
  branch     Branch     @relation(fields: [branchId], references: [id])
  courseType  CourseType @default(standard) @map("course_type")
  isActive   Boolean    @default(true) @map("is_active")
  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")

  students Student[]

  @@unique([name, branchId])
  @@index([branchId])
  @@map("groups")
}

model Student {
  id              String        @id @default(uuid()) @db.Uuid
  firstName       String        @map("first_name")
  lastName        String        @map("last_name")
  phone           String
  courseType       CourseType    @map("course_type")
  status          StudentStatus @default(active)

  // ─── Pricing ───
  totalPrice      Decimal       @db.Decimal(12, 2) @map("total_price")

  // ─── Express course payment (single) ───
  amountPaid      Decimal?      @db.Decimal(12, 2) @map("amount_paid")

  // ─── Standard course payments (installments) ───
  initialPayment  Decimal?      @db.Decimal(12, 2) @map("initial_payment")
  secondPayment   Decimal?      @db.Decimal(12, 2) @map("second_payment")
  thirdPayment    Decimal?      @db.Decimal(12, 2) @map("third_payment")

  // ─── Debt (auto-calculated in service layer) ───
  debt            Decimal       @default(0) @db.Decimal(12, 2)

  // ─── Payment info ───
  paymentMethod   PaymentMethod? @map("payment_method")

  // ─── Standard course specific ───
  groupId         String?       @map("group_id") @db.Uuid
  group           Group?        @relation(fields: [groupId], references: [id])
  completionDate  DateTime?     @map("completion_date")
  contractNumber  String?       @map("contract_number")
  o83             Boolean       @default(false)

  // ─── Common metadata ───
  hasDocument     Boolean       @default(false) @map("has_document")
  result          StudentResult @default(pending)
  notes           String?

  // ─── Relations ───
  branchId        String        @map("branch_id") @db.Uuid
  branch          Branch        @relation(fields: [branchId], references: [id])
  registeredBy    String        @map("registered_by") @db.Uuid
  registrar       User          @relation(fields: [registeredBy], references: [id])

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")

  @@index([branchId, courseType, deletedAt])
  @@index([courseType, status])
  @@index([groupId])
  @@index([debt])
  @@map("students")
}
```

## Debt Calculation Logic

Debt is computed in the service layer before save:

```typescript
// Express course
debt = totalPrice - (amountPaid ?? 0)

// Standard course
debt = totalPrice - (initialPayment ?? 0) - (secondPayment ?? 0) - (thirdPayment ?? 0)
```

Debt must be recalculated on every payment update. Negative debt means overpayment — validate against this.

## Roles — Access Matrix

| Domain | Owner | Manager |
|--------|-------|---------|
| Branches | Full CRUD | Read own branch only |
| Manager accounts | Create, deactivate | — |
| Students (Express) | All branches, full CRUD | Own branch only, full CRUD |
| Students (Standard) | All branches, full CRUD | Own branch only, full CRUD |
| Groups | All branches, full CRUD | Own branch: read, assign students |
| Revenue & Income | **Full access** | **No access** |
| Groups per Branch overview | Full summary | — |

**Key rules:**
- Owner sees everything across all branches. Can filter by branch + course type
- Manager sees only their branch. `branchId` is auto-set, not selectable
- Revenue/income is owner-only — manager endpoints must never expose it
- When manager creates a student, `branchId` is forced from `user.branchId`
- When owner creates a student, `branchId` must be provided in the request

## Branch Isolation Pattern

```typescript
@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetStudentsQueryDto, user: CurrentUserPayload) {
    const { page = 1, limit = 10, search, courseType, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
      ...(user.role === Role.manager && { branchId: user.branchId }),
      ...(query.branchId && user.role === Role.owner && { branchId: query.branchId }),
      ...(courseType && { courseType }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { branch: true, group: true, registrar: { select: { id: true, fullName: true } } },
      }),
      this.prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async create(dto: CreateStudentDto, user: CurrentUserPayload) {
    const branchId = user.role === Role.manager ? user.branchId : dto.branchId;

    const debt =
      dto.courseType === CourseType.express
        ? dto.totalPrice - (dto.amountPaid ?? 0)
        : dto.totalPrice - (dto.initialPayment ?? 0) - (dto.secondPayment ?? 0) - (dto.thirdPayment ?? 0);

    return this.prisma.student.create({
      data: {
        ...dto,
        branchId,
        registeredBy: user.id,
        debt,
      },
    });
  }

  async updatePayment(id: string, dto: UpdatePaymentDto, user: CurrentUserPayload) {
    const student = await this.findById(id, user);

    const debt =
      student.courseType === CourseType.express
        ? student.totalPrice.toNumber() - (dto.amountPaid ?? student.amountPaid?.toNumber() ?? 0)
        : student.totalPrice.toNumber()
          - (dto.initialPayment ?? student.initialPayment?.toNumber() ?? 0)
          - (dto.secondPayment ?? student.secondPayment?.toNumber() ?? 0)
          - (dto.thirdPayment ?? student.thirdPayment?.toNumber() ?? 0);

    return this.prisma.student.update({
      where: { id },
      data: { ...dto, debt },
    });
  }
}
```

## Controller Examples

### Students — filtered by courseType

```typescript
@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  async findAll(
    @Query() query: GetStudentsQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const { data, meta } = await this.service.findAll(query, user);
    return { data: data.map(StudentResponse.fromEntity), meta };
  }

  @Post()
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const student = await this.service.create(dto, user);
    return StudentResponse.fromEntity(student);
  }

  @Patch(':id/payment')
  async updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const student = await this.service.updatePayment(id, dto, user);
    return StudentResponse.fromEntity(student);
  }
}
```

### Groups — Owner full CRUD, Manager read own branch

```typescript
@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(user);
  }

  @Get('overview')
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  async getOverview() {
    return this.service.getBranchGroupOverview();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.owner)
  async create(@Body() dto: CreateGroupDto) {
    return this.service.create(dto);
  }
}
```

### Reports — Owner Only

```typescript
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.owner)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('revenue')
  async getRevenue(@Query() query: RevenueQueryDto) {
    return this.service.getRevenue(query);
  }

  @Get('dashboard')
  async getDashboard(@Query() query: DashboardQueryDto) {
    return this.service.getDashboard(query);
  }
}
```

## Query DTOs — Course Type Filtering

Frontend sends `courseType` param to show the correct table:

```typescript
export class GetStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

`GET /students?courseType=express` → Express table
`GET /students?courseType=standard` → Standard table
`GET /students?courseType=standard&branchId=xxx` → Owner filters by branch

## CurrentUserPayload

```typescript
interface CurrentUserPayload {
  id: string;
  role: Role;
  branchId: string | null;
}
```

Owner: `branchId: null` (all branches). Manager: `branchId: "<uuid>"` (own branch only).

## Response Format

**Single resource** — returned directly

**Paginated list** — `{ data: [...], meta: { total, page, limit, totalPages, hasNextPage, hasPreviousPage } }`

**Error** — `{ error: { code, message, details?, timestamp, path, requestId } }`

## Error Codes

| Code | Status | Usage |
|------|--------|-------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `BAD_REQUEST` | 400 | Invalid request (e.g. express fields on standard student) |
| `UNAUTHORIZED` | 401 | Auth required |
| `FORBIDDEN` | 403 | Wrong branch / insufficient role |
| `NOT_FOUND` | 404 | Student, branch, group not found |
| `CONFLICT` | 409 | Duplicate contract number, etc. |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Public()` | Skip JWT auth |
| `@CurrentUser()` | Get authenticated user (`id`, `role`, `branchId`) |
| `@Roles(Role.owner)` | Restrict to owner only (use with RolesGuard) |
| `@SkipResponseWrapper()` | Skip response wrapper |

## Module Generation

```bash
pnpm generate:module product
```

After generation:
1. Add Prisma model to `prisma/schema.prisma`
2. Run `pnpm prisma:push` or `pnpm prisma:migrate`
3. Add `branchId` if entity is branch-scoped
4. Add branch filtering in service for manager role
5. Add `@Roles(Role.owner)` on owner-only endpoints

## Code Style

**IMPORTANT: Do not write any comments in code.** All documentation lives here in AGENTS.md.

- No comments in code
- Use barrel exports (index.ts)
- Use static factory methods for response DTOs
- Use soft deletes (deletedAt)
- Use UUID for primary keys
- Always TypeScript with strict typing
- Always Prisma — never TypeORM
- Always async/await — never callbacks
- class-validator for DTOs, Zod for config
- Business logic in services, never controllers
- No magic values, no pseudo-code
- All examples must be production-ready

## Architecture Rules

- Only 2 roles: `owner` and `manager`. No student login
- Owner `branchId` is `null` — access to all branches
- Manager `branchId` is always set — every query filters by it
- Branch isolation enforced in **service layer**
- Revenue/income is **owner-only**
- Manager auto-assigns `branchId` from their token. Owner must provide it
- Debt is recalculated on every payment update — never trust client-sent debt
- Express students use `amountPaid`. Standard students use `initialPayment` + `secondPayment` + `thirdPayment`
- Standard course students must be assigned to a Group
- Validate courseType-specific fields: reject `groupId`/`contractNumber` for express, reject `amountPaid` for standard
- Use transactions for batch payment updates
- Offset-based pagination for all list endpoints
- Separate query DTOs per module with filters: `branchId`, `courseType`, `status`, `dateRange`