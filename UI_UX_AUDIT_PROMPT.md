# Auto Test CRM — UI/UX Audit & Fix Prompt

Bu promptni Claude Code ga yoki chat'ga loyiha bilan birga bering.

---

## PROMPT:

```
Sen senior frontend engineer va UI/UX designer san. 
Auto Test CRM loyihasining frontend'ida ko'plab UI/UX muammolar bor.
Sening vazifang — BARCHA sahifalarni skanirlab, muammolarni topib, 
professional darajada tuzatish.

━━━ UMUMIY QOIDALAR ━━━
- Loyiha src/ ni to'liq skanirla — barcha page, component, layout fayllarni o'qi
- Har sahifani birma-bir tekshir va tuzat
- TailwindCSS ishlatilgan — shu bilan davom et
- Mobile-first emas, DESKTOP-FIRST — CRM faqat kompyuterda ishlatiladi
- O'zbek tilida label va placeholder'lar (loyihadagi tilga mos)
- Hamma o'zgarishni real qil — mock/placeholder emas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOSQICH 1: GLOBAL UI MUAMMOLARNI TUZAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1A — JADVAL (TABLE) MUAMMOLARI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUAMMO: Yozuvlar sig'masdan pastga tushib qolyapti.
Ustun kengliklari belgilanmagan, matn wrap bo'lib ketayapti.

BARCHA jadvallarni topib, quyidagilarni qo'sh:

✅ Jadval container:
<div className="w-full overflow-x-auto">
  <table className="w-full min-w-[1200px] table-fixed">
    ...
  </table>
</div>

✅ Ustun kengliklari — colgroup bilan aniq belgilansin:
<colgroup>
  <col className="w-[50px]" />     {/* # */}
  <col className="w-[140px]" />    {/* Familya */}
  <col className="w-[120px]" />    {/* Ismi */}
  <col className="w-[120px]" />    {/* Telefon */}
  <col className="w-[110px]" />    {/* Kurs narxi */}
  <col className="w-[100px]" />    {/* To'lov */}
  <col className="w-[100px]" />    {/* Qarzdorlik */}
  <col className="w-[100px]" />    {/* Tulov turi */}
  <col className="w-[80px]" />     {/* Dakument */}
  <col className="w-[130px]" />    {/* Operator */}
  <col className="w-[90px]" />     {/* Natija */}
  <col className="w-[150px]" />    {/* Izoh */}
  <col className="w-[80px]" />     {/* Actions */}
</colgroup>

✅ Header cells — matn wrap bo'lmasin:
<th className="px-3 py-3 text-left text-xs font-semibold 
    text-gray-600 uppercase tracking-wider whitespace-nowrap 
    bg-gray-50 border-b border-gray-200">

✅ Body cells — truncate bilan:
<td className="px-3 py-3 text-sm text-gray-700 
    whitespace-nowrap overflow-hidden text-ellipsis max-w-0">

✅ Uzun matn uchun (Izoh, Familya) — tooltip bilan:
<td className="px-3 py-3 text-sm text-gray-700 
    truncate max-w-[150px]" title={fullText}>
  {fullText}
</td>

✅ Raqamlar — o'ngga tekislangan:
<td className="px-3 py-3 text-sm text-right tabular-nums">
  {formatPrice(amount)}
</td>

✅ Pul formatlash — har joyda bir xil:
// utils/format.ts
export function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('uz-UZ').format(num);
}
// 6000000 → "6 000 000"

✅ Qarzdorlik rangi:
<td className={`px-3 py-3 text-sm text-right tabular-nums font-medium
    ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
  {debt > 0 ? formatPrice(debt) : '✓ To\'langan'}
</td>

✅ Status badge:
<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full 
    text-xs font-medium ${statusColors[status]}`}>
  {statusLabels[status]}
</span>

// statusColors:
// active → 'bg-green-100 text-green-800'
// completed → 'bg-blue-100 text-blue-800'  
// dropped → 'bg-red-100 text-red-800'
// suspended → 'bg-yellow-100 text-yellow-800'
// pending → 'bg-gray-100 text-gray-800'
// passed → 'bg-green-100 text-green-800'
// failed → 'bg-red-100 text-red-800'

✅ Boolean maydonlar (Dakument, O83):
<td className="px-3 py-3 text-center">
  {value 
    ? <span className="text-green-600 text-lg">✓</span> 
    : <span className="text-red-400 text-lg">✗</span>
  }
</td>

✅ Zebra stripe + hover:
<tr className={`border-b border-gray-100 hover:bg-blue-50/50 
    transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>

✅ Bo'sh holat:
{data.length === 0 && (
  <tr>
    <td colSpan={columns.length} className="px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <svg>...</svg> {/* Empty state icon */}
        <p className="text-gray-500 text-sm">Ma'lumot topilmadi</p>
        <p className="text-gray-400 text-xs">Filter yoki qidiruv shartlarini o'zgartiring</p>
      </div>
    </td>
  </tr>
)}


1B — SAHIFA LAYOUT MUAMMOLARI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Har sahifa uchun standart layout:
<div className="p-6">
  {/* Page Header — fixed position */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
      <p className="text-sm text-gray-500 mt-1">{pageDescription}</p>
    </div>
    <div className="flex items-center gap-3">
      {/* Action buttons — O'NG TOMONDA */}
      <Button onClick={onExport} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button onClick={onCreate} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        {createLabel}
      </Button>
    </div>
  </div>

  {/* Filters — header ostida */}
  <div className="flex flex-wrap items-center gap-3 mb-4 p-4 
      bg-white rounded-lg border border-gray-200 shadow-sm">
    {/* filters here */}
  </div>

  {/* Stats cards (agar kerak bo'lsa) */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {/* stat cards */}
  </div>

  {/* Table */}
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table>...</table>
    </div>
    {/* Pagination — jadval ostida */}
    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <Pagination />
    </div>
  </div>
</div>

✅ "Yaratish" tugmasi — HAR DOIM yuqori o'ng burchakda:
HECH QACHON jadval ichida, pastda yoki modal ichida emas.
Sahifa header'ining O'NG tomonida — primary color, icon bilan.

✅ Filter paneli — jadval USTIDA, alohida card ichida:
Hech qachon sidebar'da yoki modal ichida emas.


1C — FILTER COMPONENT
━━━━━━━━━━━━━━━━━━━━━

Reusable filter component yaratib, BARCHA list sahifalarga qo'sh:

// components/ui/Filters.tsx yoki shunga o'xshash

Har sahifadagi filter'lar:

STUDENTS sahifasi:
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Qidirish...          ]  [Filial ▾]  [Kurs turi ▾]         │
│                              [Status ▾]  [  Tozalash  ]        │
└─────────────────────────────────────────────────────────────────┘

BRANCHES sahifasi:
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Qidirish...          ]  [Status ▾]  [  Tozalash  ]        │
└─────────────────────────────────────────────────────────────────┘

OPERATORS sahifasi:
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Qidirish...          ]  [Filial ▾]  [Status ▾]             │
│                                          [  Tozalash  ]        │
└─────────────────────────────────────────────────────────────────┘

GROUPS sahifasi:
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Qidirish...          ]  [Filial ▾]  [  Tozalash  ]        │
└─────────────────────────────────────────────────────────────────┘

REPORTS sahifasi:
┌─────────────────────────────────────────────────────────────────┐
│ [Filial ▾]  [Kurs turi ▾]  [Boshlanish 📅]  [Tugash 📅]       │
│                                              [  Tozalash  ]    │
└─────────────────────────────────────────────────────────────────┘

Filter element'lar:

✅ Search input:
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    type="text"
    placeholder="Ism, familya yoki telefon..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg 
        text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
        placeholder:text-gray-400"
  />
</div>

✅ Select filter (dropdown):
<select
  value={value ?? ''}
  onChange={e => onChange(e.target.value || undefined)}
  className="px-3 py-2 border border-gray-300 rounded-lg text-sm 
      bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      text-gray-700 min-w-[160px]"
>
  <option value="">Barcha {label}</option>
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>

✅ Tozalash tugmasi:
<button
  onClick={onClearAll}
  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 
      hover:bg-gray-100 rounded-lg transition-colors"
>
  ✕ Tozalash
</button>

✅ Active filter count badge:
{activeFilterCount > 0 && (
  <span className="inline-flex items-center justify-center w-5 h-5 
      text-xs font-bold text-white bg-blue-600 rounded-full">
    {activeFilterCount}
  </span>
)}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOSQICH 2: HAR BIR SAHIFANI ALOHIDA TUZAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2A — FILIALLAR (BRANCHES) SAHIFASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout:
┌──────────────────────────────────────────────────────────┐
│  Filiallar                          [+ Filial qo'shish] │
│  Barcha filiallar ro'yxati                               │
├──────────────────────────────────────────────────────────┤
│  🔍 [Qidirish...    ]    [Status ▾]    [ Tozalash ]     │
├──────────────────────────────────────────────────────────┤
│  ┌──────┬───────────────┬──────────────────┬──────────┐  │
│  │ #    │ Nomi          │ Manzil           │ Telefon  │  │
│  │      │               │                  │          │  │
│  │      │               │                  │ Manager- │  │
│  │      │               │                  │ lar soni │  │
│  │      │               │                  │          │  │
│  │      │               │                  │ Status   │  │
│  │      │               │                  │ Actions  │  │
│  └──────┴───────────────┴──────────────────┴──────────┘  │
│  ◀ 1 2 3 ▶                              Jami: 5 filial  │
└──────────────────────────────────────────────────────────┘

Jadval ustunlari: #, Nomi, Manzil, Telefon, Managerlar soni, Status, Amallar
- "Managerlar soni" — shu branchga biriktirilgan managerlar count
- Status — Active/Inactive badge
- Amallar — Edit, Delete (owner only)

Card variant (jadval o'rniga yoki qo'shimcha):
┌────────────────────────┐
│ 🏢 Minor               │
│ 📍 Toshkent, Minor...  │
│ 📞 +998 71 123 45 67   │
│ 👥 2 ta manager         │
│ ● Active                │
│         [✏️] [🗑️]       │
└────────────────────────┘
Agar branch'lar 4-8 ta bo'lsa — card grid yaxshiroq ko'rinadi.


2B — OPERATORLAR (MANAGERS) SAHIFASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout:
┌──────────────────────────────────────────────────────────┐
│  Operatorlar                     [+ Operator qo'shish]   │
│  Filial menejerlari                                      │
├──────────────────────────────────────────────────────────┤
│  🔍 [Qidirish...    ]  [Filial ▾]  [Status ▾]  [Tozala] │
├──────────────────────────────────────────────────────────┤
│  ┌────┬──────────────┬──────────────┬──────────┬───────┐ │
│  │ #  │ F.I.O        │ Telefon      │ Filial   │Status │ │
│  │    │              │              │          │       │ │
│  │ 1  │ Ali Valiyev  │ +998901111111│ Minor    │Active │ │
│  │ 2  │ Bobur Karimov│ +998902222222│ Chorsu   │Active │ │
│  │ 3  │ Test Manager │ +998909999999│ Novza    │●Inact │ │
│  └────┴──────────────┴──────────────┴──────────┴───────┘ │
│  ◀ 1 ▶                          Jami: 3 operator        │
└──────────────────────────────────────────────────────────┘

Jadval ustunlari: #, F.I.O, Telefon, Filial, Status, Amallar
- Filial — branch nomi (badge yoki link)
- Status — Active (yashil) / Inactive (qizil)
- Amallar: Edit, Reset password, Deactivate/Activate
- Inactive operator'lar — row opacity-50 yoki strikethrough

Filter:
- Filial dropdown — barcha branchlar
- Status dropdown — Active / Inactive / Barchasi
- Search — ism yoki telefon bo'yicha


2C — GURUHLAR (GROUPS) SAHIFASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layout:
┌──────────────────────────────────────────────────────────┐
│  Guruhlar                         [+ Guruh qo'shish]     │
│  Avto maktab kursi guruhlari                             │
├──────────────────────────────────────────────────────────┤
│  🔍 [Qidirish...    ]   [Filial ▾]   [ Tozalash ]       │
├──────────────────────────────────────────────────────────┤
│  ┌────┬───────────┬───────────┬──────────┬──────┬──────┐ │
│  │ #  │ Guruh nomi│ Filial    │ Jami     │Active│Amal  │ │
│  │    │           │           │ o'quvchi │      │      │ │
│  ├────┼───────────┼───────────┼──────────┼──────┼──────┤ │
│  │ 1  │ B-1       │ Minor     │ 24       │ 20   │ ✏️🗑️ │ │
│  │ 2  │ B-2       │ Minor     │ 18       │ 15   │ ✏️🗑️ │ │
│  │ 3  │ B-3       │ Chorsu    │ 12       │ 12   │ ✏️🗑️ │ │
│  └────┴───────────┴───────────┴──────────┴──────┴──────┘ │
│  ◀ 1 ▶                           Jami: 3 guruh          │
└──────────────────────────────────────────────────────────┘

Jadval ustunlari: #, Guruh nomi, Filial, Jami o'quvchi, Active o'quvchi, Amallar
- O'quvchi soni — raqam + progress bar (active/total)
- Amallar: Edit, Delete (faqat bo'sh guruh)
- Delete disabled agar studentlari bor → tooltip: "Avval o'quvchilarni o'chiring"

Filter:
- Filial dropdown (owner uchun)
- Search — guruh nomi bo'yicha


2D — STUDENTS SAHIFASI
━━━━━━━━━━━━━━━━━━━━━━

Kurs turi bo'yicha TAB:
┌──────────────────────────────────────────────────────────┐
│  O'quvchilar                     [+ O'quvchi qo'shish]   │
│                                                          │
│  ┌──────────────────┐┌──────────────────────┐            │
│  │ 📋 Tezkor kurs   ││ 📋 Avto maktab kursi │            │
│  └──────────────────┘└──────────────────────┘            │
├──────────────────────────────────────────────────────────┤
│  🔍 [Qidirish...]  [Filial ▾]  [Status ▾]  [Tozalash]   │
├──────────────────────────────────────────────────────────┤
│  ┌─── Tezkor kurs jadvali (CLAUDE.md dagi) ───────────┐  │
│  │ #  Familya  Ismi  Tel  Narx  To'lov  Qarz  ...     │  │
│  └─────────────────────────────────────────────────────┘  │
│  ◀ 1 2 3 ▶                        Jami: 45 o'quvchi     │
└──────────────────────────────────────────────────────────┘

Tab o'zgarganda:
- courseType param o'zgaradi
- Jadval ustunlari o'zgaradi (express vs standard)
- Filter'lar saqlanadi (branch, status, search)

Express tab ustunlari:
#, Familya, Ismi, Telefon, Kurs narxi, To'lov, Qarzdorlik, 
To'lov turi, Dakument, Operator, Natija, Izoh, Amallar

Standard tab ustunlari (kengroq — horizontal scroll):
#, Familya, Ismi, Telefon, Kurs narxi, Boshlang'ich to'lov, 
2-to'lov, 3-to'lov, Qarzdorlik, To'lov turi, Guruh, 
Tugatish sanasi, O83, Shartnoma, Dakument, Operator, 
Natija, Izoh, Amallar

Standard jadval kengroq — `min-w-[1600px]` bilan horizontal scroll.


2E — DASHBOARD SAHIFASI
━━━━━━━━━━━━━━━━━━━━━━━

Layout:
┌──────────────────────────────────────────────────────────┐
│  Dashboard                                               │
│  [Filial ▾: Barchasi]  [Kurs turi ▾: Barchasi]          │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │👥 156    │ │✅ 120    │ │💰 45.2M  │ │🔴 12.8M  │    │
│  │Jami      │ │Active    │ │Daromad   │ │Qarzdorlik│    │
│  │o'quvchi  │ │o'quvchi  │ │          │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────────────────┤
│  Filiallar bo'yicha                                      │
│  ┌──────────┬──────────┬──────────┬──────────┐           │
│  │ Minor    │ Chorsu   │ Novza    │Samarqand │           │
│  │ 45       │ 38       │ 42       │ 31       │           │
│  │ o'quvchi │ o'quvchi │ o'quvchi │ o'quvchi │           │
│  └──────────┴──────────┴──────────┴──────────┘           │
└──────────────────────────────────────────────────────────┘

Stat card component:
<div className="bg-white rounded-xl border border-gray-200 p-5 
    shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {value}
      </p>
    </div>
    <div className={`p-3 rounded-xl ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
  {trend && (
    <p className="text-xs text-gray-500 mt-2">{trendText}</p>
  )}
</div>


2F — REPORTS / REVENUE SAHIFASI (faqat owner)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Filter'lar:
[Filial ▾]  [Kurs turi ▾]  [📅 Boshlanish]  [📅 Tugash]  [Tozalash]

Stat cards + jadval:
┌──────────┐ ┌──────────┐ ┌──────────┐
│💰 Total  │ │📊 Paid   │ │🔴 Debt   │
│Revenue   │ │Amount    │ │Amount    │
└──────────┘ └──────────┘ └──────────┘

Filiallar bo'yicha jadval:
| Filial | O'quvchilar | Daromad | Qarzdorlik | To'langan |
|--------|-------------|---------|------------|-----------|


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOSQICH 3: UMUMIY UX YAXSHILASHLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3A — LOADING STATES
Har joyda loading spinner qo'sh:
- Jadval loading → skeleton rows (3-5 ta gray animated row)
- Button loading → spinner + disabled
- Page loading → centered spinner

<tr className="animate-pulse">
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
  <td className="px-3 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
  ...
</tr>

3B — MODAL DIZAYNI
Yaratish va tahrirlash modal'lari — yaxshi UX:
- Overlay: bg-black/50 backdrop-blur-sm
- Modal: max-w-lg, rounded-xl, shadow-2xl
- Header: border-b, ✕ tugmasi o'ng yuqorida
- Body: p-6, gap-4, label + input juftliklari
- Footer: border-t, Cancel + Submit tugmalari o'ng tomonda
- Submit tugma — loading state bilan
- Form validation — real-time, field ostida qizil xato

3C — TOAST/NOTIFICATION
Muvaffaqiyat va xato bildirishnomalari:
- Yaratildi → yashil toast "O'quvchi muvaffaqiyatli qo'shildi"
- Xato → qizil toast "Xatolik yuz berdi: ..."  
- O'chirildi → sariq toast "O'quvchi o'chirildi"
- Position: top-right, auto-dismiss 3-5s

3D — CONFIRM DIALOG
O'chirish oldidan tasdiqlash:
"Siz 'Ali Valiyev' ni o'chirishni xohlaysizmi?"
[Bekor qilish]  [🗑️ O'chirish]
O'chirish tugmasi qizil, icon bilan.

3E — PAGINATION
Professional pagination component:
┌────────────────────────────────────────────────────────┐
│ 1-10 / 156 ta ko'rsatilmoqda    ◀ 1 2 3 ... 16 ▶     │
└────────────────────────────────────────────────────────┘

- Hozirgi sahifa — filled button
- Boshqa sahifalar — outline
- First/Last, Prev/Next
- Total count ko'rsatilsin

3F — SIDEBAR ACTIVE STATE
Sidebar'da hozirgi sahifa highlighted bo'lsin:
- Active item — bg-blue-50 text-blue-700 border-l-4 border-blue-700
- Hover — bg-gray-50
- Icon + text

3G — RESPONSIVE TABLE ACTIONS
Actions column — dropdown menu (3+ action bo'lsa):
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreHorizontal className="w-4 h-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={onEdit}>✏️ Tahrirlash</DropdownMenuItem>
    <DropdownMenuItem onClick={onPayment}>💰 To'lov</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={onDelete} className="text-red-600">
      🗑️ O'chirish
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BOSQICH 4: TEKSHIRISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Barcha fix'lardan keyin quyidagilarni tekshir:

JADVALLAR:
□ Hech qaysi ustun matni pastga tushib ketmaydi (truncate ishlaydi)
□ Horizontal scroll uzun jadvallar uchun ishlaydi
□ Raqamlar o'ngga tekislangan
□ Pul formati bir xil (1 000 000)
□ Qarzdorlik > 0 qizil, 0 bo'lsa yashil
□ Status badge'lar rangli
□ Boolean ✓/✗ ko'rinadi
□ Bo'sh holat — "Ma'lumot topilmadi" ko'rinadi
□ Loading — skeleton ko'rinadi

FILTER'LAR:
□ Har sahifada filter paneli bor
□ Search ishlaydi (debounce 300ms bilan)
□ Dropdown'lar ishlaydi
□ "Tozalash" barcha filter'larni reset qiladi
□ Bo'sh param yuborilmaydi (cleanParams)
□ Filter active count ko'rinadi

TUGMALAR:
□ "Yaratish" tugmasi — yuqori o'ng burchakda
□ Primary color (blue), icon bilan
□ Loading state bor
□ Disabled holat bor

MODAL'LAR:
□ Overlay backdrop bilan
□ Form validation ishlaydi
□ Submit loading state
□ Close — ✕ yoki overlay click

PAGINATION:
□ Har jadval ostida
□ Total count ko'rinadi
□ Sahifa o'zgarganda data yangilanadi

TOAST:
□ CRUD operatsiyalardan keyin notification
□ Auto-dismiss

pnpm build → xatosiz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOSHLASH! Avval src/ ni skanirla, barcha sahifalarni top,
keyin BOSQICH 1 dan boshlab birma-bir tuzat.
```