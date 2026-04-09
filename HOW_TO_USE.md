# Qanday Ishlash Kerak — Amaliy Qo'llanma

## 1. Tayyor Fayllar

Sizda 2 ta fayl bor:

| Fayl | Vazifasi |
|------|----------|
| `CLAUDE.md` | Loyiha qoidalari. Claude har safar shunga qarab kod yozadi |
| `AUTO_TEST_CRM_BUILD_PLAN.md` | Task ro'yxati. Siz shundan o'qib, Claude'ga task berасиз |

---

## 2. Ishlash Jarayoni

```
BUILD_PLAN'dan task o'qing
        ↓
Yangi Claude conversation oching
        ↓
CLAUDE.md ni attach qiling
        ↓
Task'ni so'z bilan yozing
        ↓
Claude kod yozadi
        ↓
Kodni loyihaga qo'shing
        ↓
TEST bo'limini o'tkazing
        ↓
✅ O'tdi → keyingi task
❌ O'tmadi → shu conversation'da tuzating
```

---

## 3. Har Bir Task Uchun Aniq Misol

---

### TASK 1.1 — Prisma Schema + Seed

**1-qadam:** BUILD_PLAN'dan TASK 1.1 ni o'qing

**2-qadam:** Claude.ai da yangi chat oching

**3-qadam:** CLAUDE.md faylini attach qiling (skrepka tugmasi bilan)

**4-qadam:** Shu xabarni yozing:

```
CLAUDE.md ni o'qib ol — bu loyiha qoidalari.

TASK 1.1: Prisma schema va seed faylini yoz.

1. prisma/schema.prisma — CLAUDE.md dagi barcha modellar 
   (User, Branch, Group, Student) va enumlarni to'liq yoz
2. prisma/seed.ts — quyidagilarni yarat:
   - 1 ta owner (phone: +998901234567, password: owner123)
   - 4 ta branch: Minor, Chorsu, Novza, Samarqand
   - 4 ta manager (har branch'ga bitta):
     - Minor manager: +998901111111
     - Chorsu manager: +998902222222
     - Novza manager: +998903333333
     - Samarqand manager: +998904444444
   - Parollar bcrypt bilan hash qilinsin
3. package.json ga prisma script'larni qo'sh

Kodni to'liq ber, pseudo-code emas.
```

**5-qadam:** Claude javob beradi — kodni loyihangizga qo'shing

**6-qadam:** Terminal'da test qiling:
```bash
pnpm prisma:push
pnpm prisma:seed
pnpm prisma:studio
# Prisma Studio'da 5 user, 4 branch borligini tekshiring
```

**7-qadam:** Ishlasa → TASK 1.2 ga o'ting. Ishlamasa → shu chat'da xatoni yuboring:
```
Shu xato chiqdi:

[xato matnini copy-paste qiling]

Tuzat.
```

---

### TASK 1.2 — Auth Module

**Yangi chat oching. CLAUDE.md ni attach qiling.**

```
CLAUDE.md ni o'qib ol — bu loyiha qoidalari.

TASK 1.2: Auth module yoz.

Loyihada allaqachon bor:
- Prisma schema to'liq (User, Branch, Group, Student)
- Seed: 1 owner + 4 branch + 4 manager
- Ularga tegma, buzma.

Yozish kerak:
1. src/modules/auth/ — module, controller, service
2. POST /auth/login — phone + password → JWT token
   - Token payload: { id, role, branchId }
   - Noto'g'ri parol → 401
   - Topilmagan telefon → 401
   - isActive: false bo'lsa → 401 "Account deactivated"
3. JwtStrategy — token'dan CurrentUserPayload extract
4. JwtAuthGuard — global guard (app.module'da)
5. @Public() decorator — login endpoint'ga qo'yilsin
6. GET /auth/me — token'dan user info qaytarsin (@Public emas)

DTO'lar class-validator bilan. Kodni to'liq ber.
```

**Test:**
```bash
pnpm start:dev

# Owner login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+998901234567", "password": "owner123"}'

# Token olasiz — saqlab qo'ying
# Manager login ham tekshiring
# Noto'g'ri parol bilan tekshiring → 401
```

---

### TASK 1.3 — RolesGuard

**Yangi chat oching. CLAUDE.md ni attach qiling.**

```
CLAUDE.md ni o'qib ol.

TASK 1.3: RolesGuard va decoratorlar.

Loyihada allaqachon bor:
- Prisma schema, seed
- Auth module (login, JWT, JwtAuthGuard, @Public)
- Ularga tegma.

Yozish kerak:
1. src/core/guards/roles.guard.ts — @Roles() decorator bilan ishlaydi
   - Endpoint'da @Roles(Role.owner) bo'lsa — faqat owner kiradi
   - Role mos kelmasa → 403 Forbidden
2. src/core/decorators/roles.decorator.ts — SetMetadata bilan
3. src/core/decorators/current-user.decorator.ts — request.user dan oladi
4. src/common/types/current-user-payload.ts:
   interface CurrentUserPayload {
     id: string;
     role: Role;
     branchId: string | null;
   }

Kodni to'liq ber.
```

---

### TASK 2.1 — Branches Module

**Yangi chat. CLAUDE.md attach.**

```
CLAUDE.md ni o'qib ol.

TASK 2.1: Branches module.

Loyihada bor: Prisma schema, Auth (login, JWT), RolesGuard, @Roles, 
@CurrentUser. Ularga tegma.

Yozish kerak:
1. src/modules/branches/ — module, controller, service, dto'lar

Endpoint'lar:
- GET /branches
  - Owner → barcha branchlar (deletedAt: null)
  - Manager → faqat o'z branch'i (1 ta)
- GET /branches/:id
  - Owner → istalgan branch
  - Manager → faqat o'z branch'i, boshqasi → 403
- POST /branches — @Roles(Role.owner)
  - Body: { name, address, phone? }
  - name unique bo'lsin
- PATCH /branches/:id — @Roles(Role.owner)
- DELETE /branches/:id — @Roles(Role.owner) — soft delete

Response DTO: BranchResponse — static fromEntity

Kodni to'liq ber, barcha fayllar bilan.
```

---

### TASK 3.1 — Express Students

**Yangi chat. CLAUDE.md attach.**

```
CLAUDE.md ni o'qib ol.

TASK 3.1: Students module — faqat Express (tezkor) kurs.

Loyihada bor: Schema, Auth, RolesGuard, Branches module. Tegma.

Yozish kerak:
1. src/modules/students/ — module, controller, service, dto'lar

POST /students (express kurs):
Body: {
  firstName, lastName, phone, courseType: "express",
  totalPrice, amountPaid?, paymentMethod?,
  hasDocument?, notes?
}
- Manager: branchId auto-set (user.branchId dan)
- Owner: branchId body'da kelishi kerak
- debt = totalPrice - (amountPaid ?? 0)
- registeredBy = user.id

GET /students?courseType=express
- Manager: faqat o'z branch'i
- Owner: hamma (optional branchId filter)
- Search: firstName, lastName, phone bo'yicha
- Filter: status
- Pagination: page, limit
- Include: branch, registrar (id + fullName)

PATCH /students/:id
- Branch check: manager faqat o'z branch'i
- debt qayta hisoblanadi

DELETE /students/:id — soft delete, branch check

Response DTO: StudentResponse — TZ jadvaldagi barcha maydonlar.
Express uchun: lastName, firstName, phone, totalPrice, 
amountPaid, debt, paymentMethod, hasDocument, operator, result, notes

Kodni to'liq ber.
```

---

### TASK 3.2 — Standard Students

**Yangi chat. CLAUDE.md attach.**

```
CLAUDE.md ni o'qib ol.

TASK 3.2: Students module'ga standard kurs qo'sh.

Loyihada bor: Schema, Auth, Branches, Students (express ishlayapti). Tegma.

Qo'shish kerak:
1. POST /students — courseType: "standard" bilan:
   Body: {
     firstName, lastName, phone, courseType: "standard",
     totalPrice, initialPayment?, secondPayment?, thirdPayment?,
     paymentMethod?, groupId?, contractNumber?, completionDate?,
     o83?, hasDocument?, notes?
   }
   - debt = totalPrice - (initial + second + third)

2. Validatsiya:
   - express student'ga groupId, contractNumber, initialPayment, 
     secondPayment, thirdPayment reject → 400
   - standard student'ga amountPaid reject → 400

3. PATCH /students/:id/payment — to'lov yangilash:
   - Express: { amountPaid } → debt recalculate
   - Standard: { initialPayment?, secondPayment?, thirdPayment? } 
     → debt recalculate
   - Overpayment (debt < 0) → 400

4. GET /students?courseType=standard — standard jadval response:
   TZ'dagi barcha maydonlar: installmentlar, guruh, 
   shartnoma, o83, tugatish sanasi...

CreateStudentDto'ni courseType bo'yicha conditional 
validation bilan yoz. Kodni to'liq ber.
```

---

## 4. Xato Bo'lganda Nima Qilish

Agar Claude'dan olgan kod ishlamasa:

```
Shu xato chiqdi, tuzat:

Error: 
[terminal'dagi xato matnini to'liq copy-paste qiling]

Fayl: src/modules/students/students.service.ts

Nima kutgan edim: Manager student yaratganda branchId 
auto-set bo'lishi kerak edi.

Nima bo'ldi: branchId null kelyapti.
```

**Qoida:** Xatolikni aniq tavsiflang — nima kutgansiz, nima bo'ldi, qaysi fayl.

---

## 5. Keyingi Task'ga O'tish Checklist

Keyingi task'ga o'tishdan oldin:

- [ ] Hozirgi task'ning barcha TEST'lari o'tdi
- [ ] `pnpm build` xatosiz ishlaydi
- [ ] `pnpm lint` xatosiz ishlaydi
- [ ] Oldingi module'lar buzilmagan (login hali ishlaydi, branches hali ishlaydi)

---

## 6. Claude Code (Terminal) Bilan Ishlash

Agar **Claude Code** (terminal CLI) ishlatsangiz — CLAUDE.md avtomatik o'qiladi:

```bash
# Loyiha papkasida CLAUDE.md ni joylashtiring
cp CLAUDE.md /your-project/CLAUDE.md

# Claude Code'ni ishga tushiring
claude

# Endi to'g'ridan-to'g'ri task bering:
> TASK 2.1: Branches module yoz. Endpoint'lar: GET /branches 
> (owner: all, manager: own), POST/PATCH/DELETE owner only. 
> CLAUDE.md dagi schema va patternlarga mos yoz.
```

Claude Code CLAUDE.md ni avtomatik o'qiydi — qayta attach qilish shart emas.

---

## 7. Xulosa — Golden Rules

1. **Har chat = 1 task.** Aralashtirmang.
2. **CLAUDE.md har doim attach.** Claude kontekstni bilishi kerak.
3. **"Tegma" deb ayting.** Oldingi kod buzilmasin.
4. **Test qiling.** Har task oxirida.
5. **Xatoni to'liq bering.** Copy-paste, tahmin emas.
6. **Katta task'ni bo'ling.** Agar Claude javob uzun bo'lsa — "davom et" deng.