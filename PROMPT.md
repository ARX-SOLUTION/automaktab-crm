# Auto Test CRM — Autonomous Build Prompt

Bu promptni Claude Code (terminal) ga yoki bitta chat'ga bering. CLAUDE.md va shu fayl birga attach qilinadi.

---

## PROMPT:

```
Sen senior NestJS backend developer san. Sening vazifang — Auto Test CRM loyihasini 
CLAUDE.md qoidalariga to'liq mos ravishda, bosqichma-bosqich, test qilib, oxirigacha qurish.

CLAUDE.md ni diqat bilan o'qi — bu loyihaning yagona haqiqat manbai (source of truth).
Schema, patternlar, rollar, branch isolation — hammasi o'sha yerda.

─── ISHLASH TARTIBI ───

Quyidagi TASK'larni ketma-ket bajar. Har bir task uchun:

1. YOZISH: Task'dagi barcha fayllarni to'liq yoz (pseudo-code emas, production-ready)
2. TEKSHIRISH: pnpm build ishlasin, xato bo'lmasin
3. TEST: Task oxiridagi test buyruqlarini bajar (curl, pnpm test, va h.k.)
4. NATIJA:
   - ✅ TEST O'TDI → keyingi TASK'ga o't
   - ❌ TEST O'TMADI → xatoni tuzat, qayta test qil, to'g'rilanguncha takrorla
5. QOIDA: Oldingi task'larda yozilgan kodni BUZMA. Faqat yangi kod qo'sh yoki 
   kerakli joyga import/register qo'sh.

Har task boshida qisqacha: "TASK X.X boshlayman..." deb yoz.
Har task oxirida: "✅ TASK X.X yakunlandi. Keyingi: TASK X.X" deb yoz.

─── TASK'LAR ───

TASK 1.1 — PRISMA SCHEMA + SEED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- prisma/schema.prisma — CLAUDE.md dagi to'liq schema:
  Enum: Role(owner,manager), CourseType(express,standard), 
  StudentStatus(active,completed,dropped,suspended),
  StudentResult(pending,passed,failed), PaymentMethod(cash,card,transfer),
  PaymentStatus(pending,partial,paid,overdue,refunded)
  Model: User, Branch, Group, Student — barcha maydonlar, relatsiyalar, indexlar
- prisma/seed.ts:
  Owner: fullName: "Admin Boss", phone: "+998900000000", password: "admin123" (bcrypt hash)
  Branches: Minor, Chorsu, Novza, Samarqand (address va phone bilan)
  Managers (har branch'ga bitta):
    Minor:     fullName: "Minor Manager",     phone: "+998901111111", password: "manager123"
    Chorsu:    fullName: "Chorsu Manager",    phone: "+998902222222", password: "manager123"
    Novza:     fullName: "Novza Manager",     phone: "+998903333333", password: "manager123"
    Samarqand: fullName: "Samarqand Manager", phone: "+998904444444", password: "manager123"
- package.json: prisma:push, prisma:seed, prisma:migrate, prisma:generate, prisma:studio scriptlar

Test:
  pnpm prisma:generate
  pnpm prisma:push
  pnpm prisma:seed
  → Xatosiz ishlashi kerak
  → DB'da 5 user (1 owner + 4 manager), 4 branch bo'lishi kerak


TASK 1.2 — AUTH MODULE
━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/auth/ — auth.module.ts, auth.controller.ts, auth.service.ts
- dto: login.dto.ts (phone: string, password: string — class-validator)
- POST /auth/login:
  - phone + password → bcrypt.compare
  - Topilmasa yoki parol noto'g'ri → 401 Unauthorized
  - isActive: false → 401 "Account deactivated"
  - JWT token qaytarsin: payload { id, role, branchId }
- JwtStrategy (passport-jwt) — token'dan CurrentUserPayload
- src/common/types/current-user-payload.ts:
  { id: string, role: Role, branchId: string | null }
- JwtAuthGuard — APP_GUARD sifatida global register
- src/core/decorators/public.decorator.ts — @Public() → SetMetadata('isPublic', true)
  Login endpoint'ga @Public() qo'yilsin
- GET /auth/me — @CurrentUser() dan user info qaytarsin (public emas)

Test:
  pnpm start:dev
  # Owner login:
  curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"+998900000000","password":"admin123"}'
  → JWT token qaytishi kerak

  # Manager login:
  curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"+998901111111","password":"manager123"}'
  → JWT token qaytishi kerak

  # Wrong password → 401
  # Token bilan GET /auth/me → user info qaytishi kerak
  # Token'siz GET /auth/me → 401


TASK 1.3 — ROLES GUARD + DECORATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/core/guards/roles.guard.ts:
  @Roles() metadata'ni o'qiydi, user.role tekshiradi, mos kelmasa → 403
- src/core/decorators/roles.decorator.ts: @Roles(...roles) → SetMetadata
- src/core/decorators/current-user.decorator.ts: createParamDecorator → req.user
- src/core/decorators/index.ts: barrel export
- Barcha decorator va guard'larni to'g'ri export qil

Test:
  # GET /auth/me owner token bilan → 200, role: "owner"
  # GET /auth/me manager token bilan → 200, role: "manager", branchId bor
  # Keyingi task'larda RolesGuard ishlatiladi — hozir faqat import/export to'g'ri ishlashini tekshir
  pnpm build → xatosiz


TASK 2.1 — BRANCHES MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/branches/ — module, controller, service, dto (create, update, response)
- GET /branches:
  owner → barcha branches (deletedAt: null)
  manager → faqat o'z branch'i [{ ...ownBranch }]
- GET /branches/:id:
  owner → istalgan
  manager → faqat o'z branch'i, boshqasi → 403
- POST /branches — @Roles(Role.owner): { name, address, phone? }, name unique
- PATCH /branches/:id — @Roles(Role.owner)
- DELETE /branches/:id — @Roles(Role.owner), soft delete
- BranchResponse: { id, name, address, phone, isActive, createdAt }
- app.module.ts ga register qil

Test:
  # Owner GET /branches → 4 ta
  # Manager GET /branches → 1 ta (o'ziniki)
  # Manager POST /branches → 403
  # Owner POST /branches { name: "Yunusobod", address: "..." } → 201
  # Owner DELETE /branches/:id → soft deleted
  pnpm build → xatosiz


TASK 2.2 — USERS MODULE (MANAGER MANAGEMENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/users/ — module, controller, service, dto
- POST /users — @Roles(Role.owner): { fullName, phone, password, branchId }
  phone unique, password bcrypt hash, role: manager
- GET /users — @Roles(Role.owner): barcha managerlar
  filter: ?branchId=xxx
  owner o'zini ro'yxatda ko'rmasin (role: manager filter)
- GET /users/:id — @Roles(Role.owner)
- PATCH /users/:id — @Roles(Role.owner): fullName, phone, branchId
- PATCH /users/:id/deactivate — @Roles(Role.owner): isActive = false
- PATCH /users/:id/reset-password — @Roles(Role.owner): { newPassword }
- UserResponse: { id, fullName, phone, role, branchId, branchName, isActive, createdAt }

Test:
  # Owner POST /users → yangi manager
  # Yangi manager login qiladi
  # Owner GET /users → manager ro'yxati
  # Owner GET /users?branchId=xxx → filtrlangan
  # Manager POST /users → 403
  # Owner deactivate → manager login qila olmaydi (401)
  # Duplicate phone → 409
  pnpm build → xatosiz


TASK 3.1 — EXPRESS STUDENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/students/ — module, controller, service, dto
- POST /students:
  Body: { firstName, lastName, phone, courseType: "express", totalPrice, 
          amountPaid?, paymentMethod?, hasDocument?, notes? }
  Manager: branchId = user.branchId (auto)
  Owner: branchId body'dan (required)
  registeredBy = user.id
  debt = totalPrice - (amountPaid ?? 0)
  Overpayment check: debt < 0 → 400
- GET /students?courseType=express:
  Manager: where.branchId = user.branchId
  Owner: optional branchId filter
  Search: ?search= → firstName, lastName, phone (OR, insensitive)
  Filter: ?status=active
  Pagination: ?page=1&limit=10
  Include: branch({ select: {id,name} }), registrar({ select: {id,fullName} })
  OrderBy: createdAt desc
- GET /students/:id — branch check
- PATCH /students/:id — debt recalculate, branch check
- PATCH /students/:id/payment — { amountPaid } → debt recalculate
- DELETE /students/:id — soft delete, branch check
- StudentResponse: CLAUDE.md dagi express jadval maydonlari

Test:
  # Manager POST express student → 201, debt hisoblangan
  # totalPrice: 650000, amountPaid: 200000 → debt: 450000
  # Owner POST bilan branchId → 201
  # Owner POST branchId'siz → 400
  # Manager GET ?courseType=express → faqat o'z branch
  # Owner GET ?courseType=express → hamma
  # Owner GET ?courseType=express&branchId=xxx → filtrlangan
  # Search test: ?search=Manager → ismi bo'yicha topadi
  # PATCH payment: amountPaid: 500000 → debt: 150000
  # Overpayment: amountPaid: 800000 (> totalPrice) → 400
  # Manager boshqa branch student → 403
  pnpm build → xatosiz


TASK 3.2 — STANDARD STUDENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Qo'sh (students module'ga):
- POST /students courseType: "standard":
  Body: { firstName, lastName, phone, courseType: "standard", totalPrice,
          initialPayment?, secondPayment?, thirdPayment?, paymentMethod?,
          groupId?, contractNumber?, completionDate?, o83?, hasDocument?, notes? }
  debt = totalPrice - (initialPayment ?? 0) - (secondPayment ?? 0) - (thirdPayment ?? 0)
- DTO Validatsiya (CreateStudentDto):
  courseType=express → groupId, contractNumber, initialPayment, secondPayment, 
  thirdPayment REJECT (400 agar kelsa)
  courseType=standard → amountPaid REJECT (400 agar kelsa)
- PATCH /students/:id/payment:
  express: { amountPaid } → debt = totalPrice - amountPaid
  standard: { initialPayment?, secondPayment?, thirdPayment? } 
  → debt = totalPrice - sum(installments)
  Overpayment → 400
- GET /students?courseType=standard:
  Response'da standard maydonlar: installments, group, contractNumber, 
  completionDate, o83
- StudentResponse: courseType'ga qarab turli maydonlar

Test:
  # POST standard: totalPrice: 6000000, initialPayment: 1000000 → debt: 5000000
  # PATCH payment: secondPayment: 200000 → debt: 4800000
  # PATCH payment: thirdPayment: 400000 → debt: 4400000
  # POST standard + amountPaid → 400
  # POST express + groupId → 400
  # GET ?courseType=standard → faqat standard
  # GET ?courseType=express → faqat express (oldingi test buzilmagan)
  pnpm build → xatosiz


TASK 4.1 — GROUPS MODULE
━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/groups/ — module, controller, service, dto
- POST /groups — @Roles(Role.owner): { name, branchId }
  name + branchId unique combination
- GET /groups:
  Owner: barcha (optional ?branchId= filter)
  Manager: faqat o'z branch'i
  Include: _count.students (studentlar soni)
- GET /groups/:id — student count bilan
- PATCH /groups/:id — @Roles(Role.owner)
- DELETE /groups/:id — @Roles(Role.owner), studenti bo'lsa → 400
- GET /groups/overview — @Roles(Role.owner):
  Har branch uchun: { branch: {id,name}, groups: [{id, name, totalStudents, activeStudents}] }

Test:
  # Owner POST group → 201
  # Duplicate name+branch → 409
  # Same name different branch → OK
  # Manager GET → o'z branch guruhlari
  # Student'ni guruhga assign (PATCH /students/:id { groupId }) → ishlaydi
  # Express student'ga groupId → 400
  # Owner GET /groups/overview → branch-group-count
  # Manager GET /groups/overview → 403
  # Delete group with students → 400
  # Delete empty group → OK
  pnpm build → xatosiz


TASK 5.1 — REPORTS MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- src/modules/reports/ — module, controller, service
- Butun module @Roles(Role.owner) bilan himoyalangan

- GET /reports/revenue:
  Filter: ?branchId, ?courseType, ?startDate, ?endDate
  Response: {
    totalRevenue (SUM of totalPrice - debt for all matching students),
    totalDebt (SUM of debt),
    totalStudents,
    byBranch: [{ branchId, branchName, revenue, debt, studentCount }],
    byCourseType: [{ courseType, revenue, debt, studentCount }]
  }

- GET /reports/dashboard:
  Response: {
    totalStudents, activeStudents, completedStudents, droppedStudents,
    totalRevenue, totalDebt,
    byBranch: [{ branchId, branchName, studentCount, activeCount }],
    byCourseType: [{ courseType, studentCount }]
  }

Test:
  # Owner GET /reports/revenue → raqamlar to'g'ri
  # Owner GET /reports/revenue?branchId=xxx → faqat shu branch
  # Owner GET /reports/revenue?courseType=express → faqat express
  # Manager GET /reports/revenue → 403
  # Manager GET /reports/dashboard → 403
  # Owner GET /reports/dashboard → global stats
  pnpm build → xatosiz


TASK 6.1 — SEED DEMO DATA
━━━━━━━━━━━━━━━━━━━━━━━━━
Seed'ni kengaytir (prisma/seed.ts):
- Har branch'ga 2-3 ta group
- Har group'ga 5-8 ta standard student (har xil to'lov holatlari: 
  to'liq to'langan debt:0, qisman, qarzdor)
- Har branch'ga 5-8 ta express student (har xil holat)
- Ba'zi studentlar: result: passed, ba'zilari: failed, ko'pchiligi: pending
- Ba'zilari: hasDocument: true, ba'zilari: false

Test:
  pnpm prisma:migrate reset (yoki push --force-reset)
  pnpm prisma:seed
  → Xatosiz
  → Owner login → GET /reports/dashboard → real raqamlar
  → GET /students?courseType=express → ro'yxat bor
  → GET /students?courseType=standard → ro'yxat bor
  → GET /groups/overview → guruhlar + student count
  pnpm build → xatosiz


TASK 6.2 — SWAGGER DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Qo'sh:
- main.ts: SwaggerModule setup, DocumentBuilder
  title: "Auto Test CRM API"
  description: "Driving school management system"
  version: "1.0"
  addBearerAuth()
  Path: /api/docs
- Barcha controller'larga @ApiTags
- Barcha endpoint'larga @ApiBearerAuth (public'dan tashqari)
- Barcha DTO field'larga @ApiProperty / @ApiPropertyOptional
- Response DTO'larga @ApiProperty
- Enum field'larga @ApiProperty({ enum: EnumName })

Test:
  pnpm start:dev
  http://localhost:3000/api/docs ochiladi
  Barcha endpoint'lar ko'rinadi
  Authorize tugmasi bilan token qo'yib test qilsa ishlaydi
  pnpm build → xatosiz


TASK 7.1 — SECURITY HARDENING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tekshir va tuzat:
- Barcha password'lar bcrypt hash (DB'da plain text yo'q)
- JWT payload'da password yo'q
- Manager hech qanday yo'l bilan boshqa branch data'siga kira olmaydi:
  GET /students boshqa branch student → bo'sh yoki 403
  PATCH boshqa branch student → 403
  Revenue → 403
- Soft deleted data hech qayerda qaytmaydi (barcha where'larda deletedAt: null)
- Rate limiting: @nestjs/throttler → global 100 req/min
- Helmet middleware
- CORS konfiguratsiya
- Validation pipe global (whitelist: true, forbidNonWhitelisted: true)

Test:
  # Manager token bilan boshqa branch student GET → bo'sh [] (yoki 403)
  # Manager token bilan boshqa branch student PATCH → 403
  # Manager token bilan revenue → 403
  # Manager token bilan POST /users → 403
  # Manager token bilan POST /branches → 403
  # Deleted student GET da ko'rinmaydi
  # 100+ request tez yuborish → 429
  pnpm build → xatosiz


TASK 8.1 — DOCKER + FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━
Yoz:
- Dockerfile (multi-stage: build + production)
- docker-compose.yml: app + postgres + redis
- .env.example: barcha env variable'lar
- Health check endpoint ishlayotganini tekshir

Test:
  docker-compose up -d
  → App ishlaydi
  → Login ishlaydi
  → Barcha endpoint'lar ishlaydi
  pnpm build → xatosiz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endi TASK 1.1 dan boshla. Har task oxirida natijani yoz va keyingisiga o't.
Xato bo'lsa — tuzat va qayta test qil.
BOSHLASH!
```