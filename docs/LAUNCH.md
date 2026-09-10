# تشغيل Al Ghaly Platform

## المتطلبات
- Node.js 20+
- Docker Desktop / Docker Engine
- PostgreSQL 16 (أو Docker المرفق)
- pg_dump عند استخدام النسخ الاحتياطي المباشر

## 1) الإعداد
انسخ `.env.example` إلى `.env` ثم عدّل:
- `JWT_SECRET`
- `MASTER_ADMIN_PASSWORD`
- `MASTER_ADMIN_EMAIL` و`MASTER_ADMIN_PHONE` عند الحاجة
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `UPLOAD_DIR`

## 2) قاعدة البيانات
```bash
docker compose -f infra/docker-compose.yml up -d
npm install
npm run db:generate
npm run db:push
# بعد إنشاء الجداول، نفّذ packages/db/prisma/master-admin-guard.sql على قاعدة البيانات
npm run db:seed
```

## 3) التشغيل
```bash
npm run dev
```
- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

## 4) الإنتاج
```bash
npm run build
npm --prefix apps/api start
npm --prefix apps/web start
```
ضع Reverse Proxy أمام المنصة مع HTTPS، واضبط `CORS_ORIGIN` على النطاق الحقيقي.

## 5) النسخ الاحتياطي
من لوحة Super Admin افتح النسخ الاحتياطي لتعديل الجدولة وتشغيل نسخة يدويًا، أو استخدم:
- `scripts/backup-linux.sh`
- `scripts/backup-windows.ps1`

التخزين المحلي هو الافتراضي لتجنب اشتراكات SaaS. خدمات WhatsApp/SMS/Email/Push والتخزين السحابي اختيارية.
