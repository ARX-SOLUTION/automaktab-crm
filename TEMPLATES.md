# Templates

SSR templatelar `src/infra/templates/` ichida saqlanadi.

Struktura:

- `layouts/` umumiy layoutlar
- `pages/` to'liq render qilinadigan sahifalar
- `partials/` qayta ishlatiladigan bloklar
- `helpers/` Handlebars helper registratsiyasi
- `types.ts` page context interfeyslari

Yangi page qo'shish:

1. `src/infra/templates/pages/<name>.hbs` yarating.
2. `TemplatePageName` va `PageContextMap` ga qo'shing.
3. `PagesService` ichida page context builder yozing.
4. `PagesController` da route qo'shing.
5. Kerak bo'lsa `public/js/<name>.js` va CSS selectorlarini qo'shing.

Helperlar:

- `formatUZS` pulni `soʻm` formatida chiqaradi.
- `debtBadge` va `debtClass` qarzdorlik ko'rinishini beradi.
- `courseTypeLabel` kurs turini labelga aylantiradi.
- `activeClass`, `ifEquals`, `unlessEquals`, `add` UI renderda ishlatiladi.
- `branchOptions` SSR branch filter selectini role asosida quradi.

Branch isolation:

- Manager page contextiga faqat o'z branchi yuboriladi.
- Owner barcha branchlarni ko'radi.
- Template bu cheklovni faqat aks ettiradi; haqiqiy filter service qatlamida qo'llanadi.
