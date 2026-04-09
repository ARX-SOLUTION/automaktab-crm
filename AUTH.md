# SSR Auth

SSR web qatlam `JWT + HttpOnly cookie` bilan ishlaydi.

- API login o'zgarmagan: `POST /auth/login` bearer token qaytaradi.
- SSR login yangi route orqali ishlaydi: `GET /app/login`, `POST /app/login`, `POST /app/logout`.
- Cookie `jwt` nomi bilan saqlanadi.
- `HttpOnly`, `SameSite=Strict`, `Secure` faqat production.
- Cookie TTL `JWT_ACCESS_EXPIRES_IN` qiymatidan olinadi.

Role matrix:

- `owner`: `/app/dashboard`, `/app/students`, `/app/branches`, `/app/managers`, `/app/reports`, `/app/groups/overview`
- `manager`: `/app/dashboard`, `/app/students`

Guardlar:

- `SsrAuthGuard` cookie'dan tokenni olib, request user contextini boyitadi.
- `SsrRolesGuard` owner-only SSR page'larda managerni `/app/students` ga redirect qiladi.

Muhim qoida:

- Template ichidagi role check faqat UI uchun.
- Branch isolation va permission enforcement service/guard qatlamida saqlanadi.
