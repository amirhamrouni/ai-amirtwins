# GemeenteGPT Local 🇳🇱

مساعد ذكي للإجراءات البيروقراطية الهولندية — يعمل محلياً بدون اعتماديات خارجية عدا Kimi API.

## المميزات

- **واجهة عربية RTL** — محادثة بالعربية، نماذج بالهولندية
- **اقتصاد التوكن** — حد يومي، تلخيص PDF، كاش 24 ساعة
- **OCR محلي** — tesseract.js للصور (0 توكن)
- **وكلاء متخصصون** — ملء النماذج، المواعيد، القانوني، قراءة الوثائق
- **SQLite محلي** — لا Postgres، لا Redis، لا S3

## التشغيل السريع

```bash
# 1. نسخ متغيرات البيئة
cp .env.example .env.local
# أضف MOONSHOT_API_KEY و NEXTAUTH_SECRET

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد قاعدة البيانات
npm run db:push

# 4. تشغيل التطبيق
npm run dev
# → http://localhost:3000
```

## اقتصاد التوكن

| الميزة | التوكن |
|--------|--------|
| ردود ثابتة (تحية، شكر) | 0 |
| من الكاش (24 ساعة) | 0 |
| OCR محلي للصور | 0 |
| تلخيص PDF (مكثف) | ~100 |
| تلخيص PDF (عادي) | ~150 |
| محادثة عادية | ~200-600 |
| وضع التوفير (بدون وكلاء) | توفير 80% |

## قواعد التوكن

1. **السياق**: لا يُخزن نص PDF كامل — ملخص 150 توكن فقط
2. **الكاش**: SHA256(userId + question + fileIds) — TTL 24 ساعة
3. **الكسل**: فحص النية قبل استدعاء الوكلاء
4. **الحد**: max_tokens=600 للمحادثة، 1500 لتوليد PDF
5. **النظام**: 22 توكن فقط للـ system prompt
6. **العداد**: حد يومي، يُظهر في الواجهة، يحجب عند التجاوز

## هيكل الملفات

```
gemeente-gpt-local/
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # رفع الملفات + تلخيص
│   │   ├── chat/route.ts      # المحادثة + الوكلاء
│   │   └── settings/route.ts  # الإعدادات
│   ├── dashboard/page.tsx     # واجهة المحادثة
│   ├── documents/page.tsx     # إدارة الوثائق
│   ├── settings/page.tsx      # لوحة الإعدادات
│   └── login/page.tsx         # تسجيل الدخول
├── lib/
│   ├── kimi.ts               # عميل Kimi AI
│   ├── cache.ts              # كاش node-cache
│   ├── token-manager.ts      # إدارة التوكن
│   ├── prisma.ts             # Prisma singleton
│   └── auth.ts               # NextAuth config
├── prisma/
│   └── schema.prisma         # SQLite schema
├── middleware.ts             # حماية المسارات + فحص التوكن
├── .env.example
├── docker-compose.yml
└── Dockerfile
```

## Docker (لاحقاً)

```bash
docker-compose up --build
```

نفس الكود يعمل محلياً وفي Docker. لتغيير قاعدة البيانات إلى Postgres:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/gemeente_gpt"
```

## الإعدادات

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `MOONSHOT_API_KEY` | مفتاح Kimi API | مطلوب |
| `DATABASE_URL` | مسار SQLite | `file:./dev.db` |
| `NEXTAUTH_SECRET` | سر JWT | مطلوب |
| `TOKEN_DAILY_LIMIT` | حد التوكن اليومي | `10000` |
| `LOCAL_OCR_ONLY` | OCR محلي فقط | `true` |
