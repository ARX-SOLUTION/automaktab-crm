# Auto Test CRM — Full Build Plan

Step-by-step task breakdown. Har bir **TASK** ni alohida Claude conversation'da bajaring. Har task oxirida **TEST** bo'limi bor — keyingi task'ga o'tmasdan oldin test'larni o'tkazing.

---

## PHASE 1: Project Foundation

### TASK 1.1 — Boilerplate Setup + Prisma Schema

**Claude'ga bering:**
> CLAUDE.md faylini attach qiling va deng:
> "Shu CLAUDE.md asosida loyihani bootstrap qil. Prisma schema'ni to'liq yoz (User, Branch, Group, Student — barcha enum'lar bilan). Seed fayl yoz: 1 ta owner, 4 ta branch (Minor, Chorsu, Novza, Samarqand), har branch'ga 1 ta manager account."

**Natija:**
- `prisma/schema.prisma` — to'liq schema (barcha modellar, enumlar, relatsiyalar, indexlar)
- `prisma/seed.ts` — owner + 4 branch + 4 manager
- `pnpm prisma:push` va `pnpm prisma:seed` ishlashi kerak

**TEST:**
```bash
pnpm prisma:push
pnpm prisma:seed
pnpm prisma:studio
# Prisma Studio'da tekshiring:
# ✅ users jadvalida 5 ta yozuv (1 owner + 4 manager)
# ✅ branches jadvalida 4 ta yozuv
# ✅ Har manager'ning branchId to'g'ri branch'ga bog'langan
# ✅ Owner'ning branchId null
```

---

### TASK 1.2 — Auth Module (Login Only)

**Claude'ga bering:**
> "Auth module yoz. Faqat login endpoint: phone + password bilan JWT token qaytarsin. Token payload'da id, role, branchId bo'lsin. Register endpoint kerak emas — owner manager'larni boshqa endpoint orqali yaratadi. JwtAuthGuard global bo'lsin. @Public() decorator login'ga qo'yilsin."

**Natija:**
- `src/modules/auth/` — module, controller, service, dto'lar
- `POST /auth/login` — phone + password → JWT token
- `JwtStrategy` — token'dan CurrentUserPayload extract qiladi
- Global `JwtAuthGuard`

**TEST:**
```bash
pnpm start:dev

# ✅ Login with owner
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "owner_phone", "password": "owner_pass"}'
# JWT token qaytishi kerak

# ✅ Login with manager
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "manager1_phone", "password": "manager_pass"}'
# JWT token qaytishi kerak, branchId bor

# ✅ Wrong password → 401
# ✅ Non-existent phone → 401
# ✅ Protected endpoint without token → 401
curl http://localhost:3000/health  # should work (@Public)
```

---

### TASK 1.3 — RolesGuard + CurrentUser Setup

**Claude'ga bering:**
> "RolesGuard yoz. @Roles(Role.owner) qo'yilgan endpoint'ga manager kirsa 403 qaytarsin. CurrentUserPayload type'ni yoz: { id, role, branchId }. @CurrentUser() decorator'ni yoz. Test controller yoz: GET /auth/me — current user ma'lumotlarini qaytarsin."

**Natija:**
- `src/core/guards/roles.guard.ts`
- `src/core/decorators/` — Roles, CurrentUser
- `src/common/types/current-user-payload.ts`
- `GET /auth/me` — token'dan user info

**TEST:**
```bash
# ✅ GET /auth/me with owner token → { id, role: "owner", branchId: null }
# ✅ GET /auth/me with manager token → { id, role: "manager", branchId: "uuid" }
# ✅ Owner-only endpoint with manager token → 403 FORBIDDEN
# ✅ Owner-only endpoint with owner token → 200 OK
```

---

## PHASE 2: Branch & User Management

### TASK 2.1 — Branches Module

**Claude'ga bering:**
> "Branches module yoz. Owner: full CRUD. Manager: faqat GET (o'z branch'ini ko'radi). GET /branches — owner barcha branch'larni ko'radi, manager faqat o'zinikini. POST/PATCH/DELETE — faqat owner."

**Natija:**
- `src/modules/branches/` — full module
- `GET /branches` — owner: all, manager: own only
- `GET /branches/:id` — owner: any, manager: own only (otherwise 403)
- `POST /branches` — owner only
- `PATCH /branches/:id` — owner only
- `DELETE /branches/:id` — owner only (soft delete)

**TEST:**
```bash
# ✅ Owner GET /branches → 4 ta branch qaytadi
# ✅ Manager GET /branches → faqat 1 ta (o'z branch'i)
# ✅ Manager GET /branches/:other_branch_id → 403
# ✅ Owner POST /branches → yangi branch yaratiladi
# ✅ Manager POST /branches → 403
# ✅ Owner DELETE /branches/:id → soft delete (deletedAt set)
# ✅ Deleted branch GET /branches da ko'rinmaydi
```

---

### TASK 2.2 — Users Module (Manager Account Management)

**Claude'ga bering:**
> "Users module yoz. Faqat owner ishlatadi. Manager account'larni CRUD qilish: yaratish (branchId bilan), deactivate qilish, parolni reset qilish. Manager o'z profilini ko'ra olsin (GET /users/me). Owner barcha manager'larni ko'rsin, branchId bo'yicha filter bilan."

**Natija:**
- `POST /users` — owner: manager yaratish (phone, password, fullName, branchId)
- `GET /users` — owner: barcha manager'lar (filter: branchId)
- `GET /users/:id` — owner: any manager
- `PATCH /users/:id` — owner: update manager
- `PATCH /users/:id/deactivate` — owner: isActive = false
- `PATCH /users/:id/reset-password` — owner: parol o'zgartirish

**TEST:**
```bash
# ✅ Owner POST /users → yangi manager yaratiladi branchId bilan
# ✅ Yangi manager login qila oladi
# ✅ Owner GET /users → manager ro'yxati
# ✅ Owner GET /users?branchId=xxx → filtrlanadi
# ✅ Manager POST /users → 403
# ✅ Owner PATCH /users/:id/deactivate → manager login qila olmaydi
# ✅ Duplicate phone bilan yaratish → 409 CONFLICT
```

---

## PHASE 3: Student Management (Core Feature)

### TASK 3.1 — Express Course Students (Tezkor Kurs)

**Claude'ga bering:**
> "Students module'ni boshlang — faqat express (tezkor) kurs uchun. CRUD: yaratish, ro'yxat, update, soft delete. Manager o'z branch'iga student qo'shadi (branchId auto-set). Owner istalgan branch'ga qo'sha oladi. Debt hisoblash: debt = totalPrice - amountPaid. Jadval maydonlari: firstName, lastName, phone, totalPrice, amountPaid, debt, paymentMethod, hasDocument, result, notes. Search: ism yoki telefon bo'yicha. Filter: status, branchId (owner)."

**Natija:**
- `POST /students` — courseType: express, debt auto-hisob
- `GET /students?courseType=express` — branch isolation bilan
- `GET /students/:id` — branch check bilan
- `PATCH /students/:id` — debt qayta hisob
- `DELETE /students/:id` — soft delete

**TEST:**
```bash
# ✅ Manager POST /students (express) → branchId auto-set, debt hisoblangan
# ✅ totalPrice: 650, amountPaid: 200 → debt: 450
# ✅ Owner POST /students (express) bilan branchId → boshqa branch'ga qo'sha oladi
# ✅ Owner POST /students branchId'siz → 400 BAD_REQUEST
# ✅ Manager GET /students?courseType=express → faqat o'z branch'i
# ✅ Owner GET /students?courseType=express → hamma
# ✅ Owner GET /students?courseType=express&branchId=xxx → filtrlangan
# ✅ Search: GET /students?courseType=express&search=test → ism/telefon bo'yicha
# ✅ PATCH /students/:id { amountPaid: 400 } → debt qayta hisoblandi (250)
# ✅ Manager boshqa branch'dagi student'ni PATCH → 403
```

---

### TASK 3.2 — Standard Course Students (Avto Maktab Kursi)

**Claude'ga bering:**
> "Students module'ga standard (avto maktab) kurs qo'shing. Bo'lib to'lash: initialPayment, secondPayment, thirdPayment. Debt = totalPrice - (initial + second + third). Qo'shimcha maydonlar: groupId, completionDate, contractNumber, o83. Validatsiya: express student'ga groupId/contractNumber reject. Standard student'ga amountPaid reject. PATCH /students/:id/payment — to'lovni yangilash endpoint'i."

**Natija:**
- `POST /students` courseType=standard bilan — installment maydonlari
- `PATCH /students/:id/payment` — to'lov update + debt recalculate
- DTO validatsiya: courseType bo'yicha maydon tekshiruvi
- Standard-specific response format (installmentlar ko'rinadi)

**TEST:**
```bash
# ✅ POST standard student: totalPrice: 6000000, initialPayment: 1000000
#    → debt: 5000000
# ✅ PATCH payment: secondPayment: 200000 → debt: 4800000
# ✅ PATCH payment: thirdPayment: 400000 → debt: 4400000
# ✅ POST standard student with amountPaid → 400 (noto'g'ri maydon)
# ✅ POST express student with groupId → 400 (noto'g'ri maydon)
# ✅ GET /students?courseType=standard → faqat standard studentlar
# ✅ GET /students?courseType=express → faqat express studentlar
# ✅ Standard student response'da installment maydonlari bor
# ✅ Express student response'da installment maydonlari yo'q
```

---

### TASK 3.3 — Payment Update Endpoint + Debt Validation

**Claude'ga bering:**
> "PATCH /students/:id/payment endpoint'ini mustahkamla. Validatsiyalar: 1) Overpayment bo'lmasin (debt < 0 reject). 2) To'lov faqat pending/partial status'dagi student'ga. 3) Agar debt 0 ga tushsa — PaymentStatus auto-update. 4) To'lov tarixi (payment log) yozilsin — alohida PaymentLog model."

**Natija:**
- `PaymentLog` model — har to'lov o'zgarishi log qilinadi
- Overpayment validation
- Auto status update (debt === 0 → paid)
- To'lov tarixini ko'rish endpoint

**TEST:**
```bash
# ✅ Overpayment attempt → 400 "Payment exceeds total price"
# ✅ To'lov qilganda PaymentLog yoziladi (amount, date, who)
# ✅ Debt 0 ga tushganda student status auto-update
# ✅ GET /students/:id/payment-history → to'lov tarixi
# ✅ Manager boshqa branch student'iga to'lov → 403
```

---

## PHASE 4: Groups Module

### TASK 4.1 — Groups CRUD + Student Assignment

**Claude'ga bering:**
> "Groups module yoz. Owner: CRUD (guruh yaratish branch'ga biriktirib). Manager: o'z branch'idagi guruhlarni ko'rish, studentni guruhga biriktirish. Guruh nomi branch ichida unique bo'lsin. Student'ni guruhga assign qilish: PATCH /students/:id { groupId }. Faqat standard kurs studentlari guruhga biriktirilsin."

**Natija:**
- `POST /groups` — owner: branch + name + courseType
- `GET /groups` — owner: all (branchId filter), manager: own branch
- `GET /groups/:id` — student count bilan
- `PATCH /groups/:id` — owner
- `DELETE /groups/:id` — owner (faqat student yo'q bo'lsa)

**TEST:**
```bash
# ✅ Owner POST /groups { name: "B-1", branchId: "minor_id" } → yaratildi
# ✅ Duplicate name + same branch → 409 CONFLICT
# ✅ Same name + different branch → OK
# ✅ Manager GET /groups → faqat o'z branch'i guruhlari
# ✅ PATCH /students/:id { groupId: "xxx" } → student guruhga biriktirildi
# ✅ Express student'ni guruhga assign → 400
# ✅ Owner DELETE /groups with students → 400 "Group has students"
# ✅ Owner DELETE empty group → OK
```

---

### TASK 4.2 — Groups per Branch Overview (Owner Only)

**Claude'ga bering:**
> "GET /groups/overview endpoint yoz — faqat owner uchun. Har branch uchun guruhlar ro'yxati: branch nomi, guruh nomi, studentlar soni, active studentlar soni. Bu TZ'dagi 'Biznes egasi uchun' qismidagi jadval."

**Natija:**
```json
[
  {
    "branch": { "id": "...", "name": "Minor" },
    "groups": [
      { "id": "...", "name": "12-guruh", "totalStudents": 24, "activeStudents": 20 }
    ]
  },
  {
    "branch": { "id": "...", "name": "Chorsu" },
    "groups": [
      { "id": "...", "name": "13-guruh", "totalStudents": 18, "activeStudents": 15 }
    ]
  }
]
```

**TEST:**
```bash
# ✅ Owner GET /groups/overview → har branch bilan guruhlar + student count
# ✅ Manager GET /groups/overview → 403
# ✅ Bo'sh branch (guruhi yo'q) → groups: []
# ✅ Student count to'g'ri (faqat active + deletedAt null)
```

---

## PHASE 5: Reports & Revenue (Owner Only)

### TASK 5.1 — Revenue Report

**Claude'ga bering:**
> "Reports module yoz — faqat owner. GET /reports/revenue: umumiy daromad, filial bo'yicha daromad, kurs turi bo'yicha daromad. Filter: branchId, courseType, dateRange (startDate, endDate). Daromad = barcha studentlarning (totalPrice - debt) yig'indisi. Manager bu endpoint'ga kira olmaydi."

**Natija:**
- `GET /reports/revenue` — filterable
- `GET /reports/revenue?branchId=xxx` — bitta filial
- `GET /reports/revenue?courseType=express` — kurs bo'yicha
- `GET /reports/revenue?startDate=2024-01-01&endDate=2024-12-31`

**Response:**
```json
{
  "totalRevenue": 45000000,
  "totalDebt": 12000000,
  "byBranch": [
    { "branch": "Minor", "revenue": 15000000, "debt": 4000000, "studentCount": 30 }
  ],
  "byCourseType": [
    { "courseType": "express", "revenue": 5000000, "studentCount": 50 },
    { "courseType": "standard", "revenue": 40000000, "studentCount": 80 }
  ]
}
```

**TEST:**
```bash
# ✅ Owner GET /reports/revenue → to'liq hisobot
# ✅ Manager GET /reports/revenue → 403
# ✅ branchId filter → faqat shu filial
# ✅ courseType filter → faqat shu kurs turi
# ✅ dateRange filter → shu oraliqda yaratilgan studentlar
# ✅ Revenue hisoblash to'g'ri: SUM(totalPrice - debt)
# ✅ Bo'sh branch → revenue: 0
```

---

### TASK 5.2 — Dashboard Stats

**Claude'ga bering:**
> "GET /reports/dashboard yoz — owner uchun umumiy statistika. Jami studentlar (active, completed, dropped), jami to'lovlar, jami qarzdorlik, filiallar bo'yicha qisqacha, kurs turlari bo'yicha. Manager uchun alohida: GET /reports/my-dashboard — faqat o'z branch'i statistikasi (revenue'siz)."

**Natija:**
- `GET /reports/dashboard` — owner: global stats
- `GET /reports/my-dashboard` — manager: own branch stats (no revenue)

**TEST:**
```bash
# ✅ Owner dashboard → global numbers, per-branch breakdown
# ✅ Manager my-dashboard → own branch only, revenue field yo'q
# ✅ Manager GET /reports/dashboard → 403
# ✅ Raqamlar to'g'ri (manual hisoblash bilan solishtiring)
```

---

## PHASE 6: Final Polish

### TASK 6.1 — Pagination, Sorting, Error Handling

**Claude'ga bering:**
> "Barcha list endpoint'larni tekshir va yaxshila: 1) Pagination to'g'ri ishlayotganini. 2) Sort: createdAt desc default, custom sort support (debt, lastName). 3) Error response'lar CLAUDE.md formatiga mos. 4) Barcha edge case'lar: bo'sh list, noto'g'ri UUID, non-existent resource."

**TEST:**
```bash
# ✅ GET /students?page=1&limit=5 → 5 ta qaytadi, meta to'g'ri
# ✅ GET /students?page=999 → bo'sh data, meta.total to'g'ri
# ✅ GET /students?limit=0 → 400 validation error
# ✅ GET /students/:non_existent_uuid → 404
# ✅ GET /students/:invalid_string → 400 validation error
# ✅ GET /students?sort=debt&order=asc → qarzdorlik bo'yicha
# ✅ Error format: { error: { code, message, timestamp, path, requestId } }
```

---

### TASK 6.2 — Seed Data for Demo

**Claude'ga bering:**
> "Seed faylni kengaytir: har branch'ga 2-3 ta guruh, har guruhga 5-10 ta standard student (har xil to'lov holatlari: to'liq to'langan, qisman, qarzdor). Har branch'ga 5-10 ta express student. Owner + 4 manager. Shunda demo qilganda real ko'rinadi."

**TEST:**
```bash
pnpm prisma:migrate reset  # clean DB
pnpm prisma:seed
pnpm prisma:studio
# ✅ 4 branch, har birida manager
# ✅ Har branch'da guruhlar bor
# ✅ Har xil to'lov holatlari (paid, partial, overdue)
# ✅ Express va standard studentlar aralash
# ✅ Owner login → dashboard real raqamlar ko'rsatadi
```

---

### TASK 6.3 — Security Audit

**Claude'ga bering:**
> "Xavfsizlik auditini o'tkaz. Tekshir: 1) Manager boshqa branch'ga hech qanday yo'l bilan kira olmasligi. 2) Manager revenue endpoint'lariga kira olmasligi. 3) Password hash qilingan (bcrypt). 4) JWT token'da password yo'q. 5) Soft deleted ma'lumotlar hech qayerda qaytmasligi. 6) SQL injection/Prisma injection yo'q. 7) Rate limiting qo'shilgan."

**TEST:**
```bash
# ✅ Manager token bilan boshqa branch student'ini GET → 403 yoki bo'sh
# ✅ Manager token bilan POST student boshqa branch'ga → branchId override, o'z branch'iga yozildi
# ✅ Manager token bilan GET /reports/revenue → 403
# ✅ Manager token bilan GET /reports/dashboard → 403
# ✅ Manager token bilan POST /branches → 403
# ✅ Manager token bilan POST /users → 403
# ✅ DB'da password hash (bcrypt) ko'rinadi, plain text emas
# ✅ JWT decode → password field yo'q
# ✅ Deleted student GET /students da ko'rinmaydi
# ✅ Deleted branch GET /branches da ko'rinmaydi
```

---

### TASK 6.4 — API Documentation (Swagger)

**Claude'ga bering:**
> "Swagger/OpenAPI dokumentatsiya to'liq sozla. Barcha endpoint'lar, DTO'lar, enum'lar, response format'lar, error code'lar. @ApiTags, @ApiBearerAuth, @ApiProperty, @ApiPropertyOptional, @ApiResponse barcha joyda. Swagger UI /api/docs da ochilsin."

**TEST:**
```bash
# ✅ http://localhost:3000/api/docs ochiladi
# ✅ Barcha endpoint'lar ko'rinadi, guruhlanadi (tags)
# ✅ "Authorize" tugmasi bilan JWT token qo'ysa ishlaydi
# ✅ Har endpoint'da request/response example bor
# ✅ Enum qiymatlari dropdown'da ko'rinadi
```

---

## PHASE 7: Frontend (React)

### TASK 7.1 — React Project Setup + Auth

**Claude'ga bering:**
> "React SPA (Vite + TypeScript + TailwindCSS + React Router + React Query) setup qil. Login page: phone + password. JWT token'ni localStorage'da saqlash. PrivateRoute: token yo'q bo'lsa login'ga redirect. Role-based routing: owner → /dashboard, manager → /students."

**TEST:**
```
# ✅ Login page ishlaydi
# ✅ Owner login → /dashboard redirect
# ✅ Manager login → /students redirect
# ✅ Token yo'q → /login redirect
# ✅ Expired token → /login redirect
```

---

### TASK 7.2 — Manager Panel: Express Students Table

**Claude'ga bering:**
> "Manager panel: Tezkor kurs jadvali. TZ'dagi jadvalga mos: Familya, Ismi, Telefon, Kurs narxi, To'lov, Qarzdorlik, Tulov turi, Dakument, Operator, Natijasi, Izoh. CRUD: qo'shish modal, tahrirlash, o'chirish. Search, pagination. Qarzdorlik > 0 bo'lsa qizil rang."

**TEST:**
```
# ✅ Jadval TZ rasmdagi ustunlarga mos
# ✅ Student qo'shish ishlaydi, debt auto-hisoblangan
# ✅ To'lov yangilash → debt o'zgaradi
# ✅ Qarzdor studentlar qizil highlight
# ✅ Search ismi/telefon bo'yicha ishlaydi
# ✅ Pagination ishlaydi
```

---

### TASK 7.3 — Manager Panel: Standard Students Table

**Claude'ga bering:**
> "Standard kurs jadvali. TZ'dagi jadvalga mos: Familya, Ismi, Telefon, Kurs narxi, Boshlang'ich tulov, 2-tulov, 3-tulov, Qarzdorlik, Tulov turi, Guruh, Tugatish sanasi, O83, Shartnoma raqami, Dakument, Operator, Natijasi, Izoh. Installment to'lovlarni alohida-alohida yangilash. Guruh tanlash dropdown."

**TEST:**
```
# ✅ Jadval TZ rasmdagi barcha ustunlarga mos (2 sahifadagi)
# ✅ Installment to'lovlar alohida edit qilinadi
# ✅ Har installment yangilanganda debt qayta hisoblanadi
# ✅ Guruh dropdown faqat shu branch guruhlari
# ✅ Shartnoma raqami, O83, tugatish sanasi ishlaydi
```

---

### TASK 7.4 — Owner Panel: Dashboard + Branch Filter

**Claude'ga bering:**
> "Owner dashboard: umumiy statistika (jami studentlar, jami daromad, jami qarzdorlik), filial bo'yicha cards, kurs turi bo'yicha. Branch filter dropdown — tanlasa o'sha branch statistikasi. Kurs turi filter (express/standard/all). Owner ham express va standard jadvallarni ko'ra olsin — branch tanlash bilan."

**TEST:**
```
# ✅ Dashboard global stats ko'rsatadi
# ✅ Branch filter → raqamlar o'zgaradi
# ✅ Course type filter ishlaydi
# ✅ Owner express jadval ko'ra oladi (barcha branch)
# ✅ Owner standard jadval ko'ra oladi (barcha branch)
# ✅ Owner branch tanlasa — faqat shu branch studentlari
```

---

### TASK 7.5 — Owner Panel: Groups Overview + Revenue

**Claude'ga bering:**
> "Owner uchun: 1) Groups overview page — TZ'dagi rasm bo'yicha har branch → guruhlar ro'yxati + student soni. Guruh CRUD. 2) Revenue page — daromad hisoboti, filial va kurs bo'yicha, date range picker. Manager bu sahifalarni ko'ra olmaydi."

**TEST:**
```
# ✅ Groups overview — branch → guruhlar → student count
# ✅ Guruh yaratish/tahrirlash/o'chirish ishlaydi
# ✅ Revenue page — raqamlar backend bilan mos
# ✅ Date range filter ishlaydi
# ✅ Branch filter ishlaydi
# ✅ Manager URL orqali /reports ga o'tsa → redirect yoki 403
```

---

### TASK 7.6 — Owner Panel: Manager Account Management

**Claude'ga bering:**
> "Owner uchun manager boshqaruv sahifasi: manager ro'yxati (qaysi branch'da), yangi manager yaratish (branch tanlash), deactivate, parol reset. Deactivated managerlar alohida ko'rinsin."

**TEST:**
```
# ✅ Manager ro'yxati branch bilan ko'rinadi
# ✅ Yangi manager yaratish + branch tanlash
# ✅ Deactivate → manager login qila olmaydi
# ✅ Password reset ishlaydi
# ✅ Manager bu sahifani ko'ra olmaydi
```

---

## PHASE 8: Final Testing & Deploy

### TASK 8.1 — End-to-End Critical Flow Test

**Claude'ga bering:**
> "Barcha critical flow'larni test qil. Menga test scenario'lar yoz va natijalarni tekshir:
> 1) Owner login → branch yaratish → manager yaratish → manager login
> 2) Manager login → express student qo'shish → to'lov → debt 0 → result: passed
> 3) Manager login → standard student → guruhga assign → 3 ta installment → debt 0
> 4) Owner → dashboard → revenue to'g'rimi → branch filter
> 5) Manager boshqa branch'ga kirish urinishi → 403
> 6) Manager revenue ko'rish urinishi → 403"

---

### TASK 8.2 — Docker + Deploy Preparation

**Claude'ga bering:**
> "Dockerfile + docker-compose.yml yoz (app + postgres + redis). .env.example yaratib, barcha environment variable'larni list qil. Production build ishlashini tekshir. Health check endpoint ishlayotganini tekshir."

**TEST:**
```bash
docker-compose up -d
# ✅ App ishlaydi
# ✅ DB migrate + seed ishlaydi
# ✅ Login ishlaydi
# ✅ Health check 200 qaytaradi
```

---

## Umumiy Qoidalar

1. **Har TASK oxirida TEST bo'limini o'tkazing** — keyingi task'ga o'tmasdanoq
2. **CLAUDE.md ni har doim attach qiling** — har yangi conversation'da
3. **Oldingi task'da yozilgan kodni buzmaslik uchun** — yangi task boshida "oldingi module'lar ishlayapti, ularga tegma" deb aytib o'ting
4. **Error bo'lsa** — xato xabarini to'liq copy-paste qiling Claude'ga
5. **Schema o'zgarganda** — `pnpm prisma:migrate` yoki `pnpm prisma:push` ni unutmang