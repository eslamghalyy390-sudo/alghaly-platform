# AlGhaly — النسخة النهائية الأساسية

## الهدف
منصة عربية RTL لإدارة الشركة والعملاء والمشاريع والمهام والخدمات والتذاكر والمستخدمين والصلاحيات والإعدادات والتكاملات.

## الأدوار
SUPER_ADMIN: كامل الصلاحيات، إعدادات النظام، المستخدمون، الأدوار، الخدمات، الهوية، السجلات.
ADMIN: الإدارة التشغيلية.
MANAGER: إدارة المشاريع والفرق.
SUPERVISOR: الإشراف على المهام.
EMPLOYEE: تنفيذ المهام المسموح بها.
CLIENT: مساحة العميل ومشاريعه وتذاكره.

## البنية
Web: Next.js/React/TypeScript + RTL.
API: Node.js/Express/TypeScript.
Database: PostgreSQL + Prisma.
Cache/queues: Redis جاهز للبنية المستقبلية.
Mobile: يمكن تغليف واجهة PWA عبر Capacitor لاحقًا دون تغيير الـAPI.

## التشغيل
1. انسخ .env.example إلى .env.
2. شغل `docker compose -f infra/docker-compose.yml up -d`.
3. شغل `npm install`.
4. `npm run db:generate`.
5. `npm run db:migrate`.
6. `npm run db:seed`.
7. `npm run dev`.

الدخول التجريبي: admin@alghaly.local / ChangeMe123!
غيّر كلمة المرور والمفتاح السري قبل أي استخدام إنتاجي.

## مراحل الإنتاج المتبقية داخل نفس المعمارية
- تفعيل تخزين الملفات S3-compatible.
- OTP والبريد والإشعارات.
- OAuth والتكاملات الرسمية لكل مزود.
- نظام الفوترة والمدفوعات عند الحاجة.
- Workers للمهام المجدولة.
- اختبارات آلية وCI/CD ومراقبة الإنتاج.
- تطبيق Capacitor Android/iOS.
