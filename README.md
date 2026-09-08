# TikTok LIVE Pizza Game — iPhone-ready bridge

هذا المشروع يفصل بين:
TikTok LIVE → Node.js bridge → WebSocket → لعبة HTML.

## مهم
TikTok لا يوفر واجهة عامة رسمية لقراءة أحداث LIVE مثل الهدايا/اللايكات، لذلك هذا المشروع يستخدم `tiktok-live-connector`، وهو مشروع غير رسمي يعتمد على Webcast الداخلي. قد يتوقف إذا غيّر TikTok البروتوكول.

## التشغيل على جهاز/سيرفر Node
1. ثبّت Node.js.
2. داخل المجلد:
   npm install
3. عرّف اسم حساب TikTok الذي سيبث:
   Linux/macOS:
   TIKTOK_USERNAME=yourusername npm start
   Windows PowerShell:
   $env:TIKTOK_USERNAME="yourusername"; npm start
4. افتح:
   http://localhost:3000/

## التشغيل مع الآيفون فقط
الآيفون يستطيع فتح صفحة اللعبة، لكنه لا يشغل Node bridge عادةً. ارفع هذا المشروع على خدمة استضافة Node مثل Render/Railway أو شغّله على كمبيوتر/VPS.
بعد الحصول على رابط HTTPS للسيرفر، افتح صفحة اللعبة منه على الآيفون.

## ربط اللعبة
الصفحة تستقبل أوامر WebSocket:
- up50
- down50
- up500
- down500
- up5000

مثال:
wss://YOUR-DOMAIN.example/ws

في هذه النسخة WebSocket يستخدم نفس السيرفر، لذلك صفحة اللعبة تُفتح من نفس الدومين.

## تعديل الهدايا
في `server.js` ابحث عن:
if (n.includes("rose"))
ثم عدّل أسماء الهدايا أو قيم diamonds حسب الهدايا التي تريدها.

## نشر سريع
على أي خدمة تدعم Node:
- Build/Install: npm install
- Start: npm start
- Environment variable:
  TIKTOK_USERNAME=اسم_حساب_تيك_توك_بدون_@

لا تضع sessionid أو كلمات مرور TikTok في ملفات المشروع.
