# منصة بديل - الباك إند

Backend API لمنصة بديل - منصة تبادل الأجهزة الطبية بين المختبرات.

## 🌟 المميزات المكتملة

### 🔐 نظام المصادقة والتخويل
- تسجيل دخول وخروج المستخدمين (JWT-based)
- نظام الأدوار (أدمن، مختبر)
- حماية المسارات وتخويل الوصول
- إعادة تعيين كلمة المرور عبر البريد الإلكتروني

### 🏥 إدارة المختبرات
- تسجيل المختبرات الجديدة مع رفع الملفات
- نظام موافقة/رفض المختبرات من الأدمن
- تعليق وتفعيل المختبرات
- إدارة ملفات التسجيل والتراخيص
- إحصائيات شاملة لكل مختبر

### 🏷️ إدارة الفئات (Categories)
- إنشاء وتعديل وحذف الفئات
- دعم الفئات الهرمية (فئات فرعية)
- فئات مميزة للصفحة الرئيسية
- إعادة ترتيب الفئات
- إحصائيات الفئات

### 📦 إدارة المنتجات
- إضافة منتجات جديدة مع الصور
- أنواع المنتجات: للبيع، للتبادل، أصول
- نظام الموافقة على المنتجات
- بحث متقدم ومرشحات ذكية
- تقييمات ومراجعات المنتجات
- المنتجات الرائجة والمميزة

### 🛒 نظام الطلبات والمبيعات
- إنشاء طلبات شراء
- تتبع حالة الطلبات
- حساب الضرائب والشحن
- نظام الدفع عبر المحافظ
- إدارة المخزون التلقائية

### 🔄 نظام التبادل
- طلبات تبادل المنتجات
- قبول/رفض طلبات التبادل
- عروض مضادة للتبادل
- تتبع حالة التبادلات
- إشعارات التبادل

### 💰 نظام المحافظ والمعاملات
- محافظ إلكترونية للمختبرات
- تحويل الأموال بين المختبرات
- تاريخ شامل للمعاملات
- إيداع وسحب الأموال (أدمن)
- إحصائيات مالية

### 📊 لوحة تحكم الأدمن
- إحصائيات شاملة للمنصة
- تحليلات الإيرادات والمستخدمين
- مراقبة صحة النظام
- إدارة جميع المحتويات
- تقارير مفصلة

### 🔍 البحث المتقدم
- بحث نصي ذكي
- مرشحات متعددة (السعر، الفئة، الحالة)
- اقتراحات البحث
- البحثات الشائعة
- ترتيب نتائج متقدم

### 🔒 الأمان المتقدم
- حماية من الهجمات (XSS, NoSQL Injection)
- معدل طلبات محدود (Rate Limiting)
- رؤوس أمان شاملة (Security Headers)
- فحص النشاط المشبوه
- حماية رفع الملفات

### 📧 نظام الإشعارات والبريد الإلكتروني
- إشعارات الموافقة/الرفض
- تأكيد التسجيل
- إشعارات الطلبات والتبادلات
- تنبيهات المخزون المنخفض

## 🛠️ التقنيات المستخدمة

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, Rate Limiting, Data Sanitization
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express Validator
- **Compression**: Gzip
- **Logging**: Morgan

## 📋 متطلبات التشغيل

- Node.js 18+ 
- MongoDB 5+
- npm 8+
- مساحة تخزين للملفات المرفوعة

## 🚀 التثبيت والتشغيل

### 1. تحضير البيئة
```bash
git clone <repository-url>
cd backend
npm install
```

### 2. إعداد المتغيرات
```bash
cp env.example .env
# قم بتعديل ملف .env حسب إعداداتك
```

### 3. تشغيل MongoDB
```bash
# إما محلياً
mongod --dbpath ~/data/db

# أو باستخدام Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. تشغيل الخادم
```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## ⚙️ المتغيرات البيئية

```env
# الخادم
PORT=8000
NODE_ENV=development
API_VERSION=v1

# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/badeel_platform

# المصادقة
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# البريد الإلكتروني
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Badeel Platform <noreply@badeel.com>

# الأدمن الافتراضي
ADMIN_DEFAULT_EMAIL=admin@badeel.com
ADMIN_DEFAULT_PASSWORD=Admin@123456

# الأمان
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_UPLOAD=10485760

# الواجهة الأمامية
FRONTEND_URL=http://localhost:3000
```

## 📚 توثيق API

### 🔐 المصادقة
```http
POST /api/v1/auth/register          # تسجيل مختبر جديد
POST /api/v1/auth/login             # تسجيل الدخول
POST /api/v1/auth/logout            # تسجيل الخروج
GET  /api/v1/auth/me                # بيانات المستخدم الحالي
POST /api/v1/auth/forgotpassword    # طلب إعادة تعيين كلمة المرور
PUT  /api/v1/auth/resetpassword/:token # إعادة تعيين كلمة المرور
```

### 🏥 إدارة المختبرات
```http
GET  /api/v1/labs                   # جميع المختبرات (أدمن)
GET  /api/v1/labs/pending           # المختبرات المعلقة
GET  /api/v1/labs/:id               # مختبر محدد
PUT  /api/v1/labs/:id/approve       # اعتماد مختبر
PUT  /api/v1/labs/:id/reject        # رفض مختبر
PUT  /api/v1/labs/:id/suspend       # تعليق مختبر
GET  /api/v1/labs/:id/statistics    # إحصائيات مختبر
GET  /api/v1/labs/my-dashboard      # لوحة تحكم مختبري
```

### 🏷️ الفئات
```http
GET    /api/v1/categories           # جميع الفئات
GET    /api/v1/categories/tree      # شجرة الفئات
GET    /api/v1/categories/featured  # الفئات المميزة
POST   /api/v1/categories           # إنشاء فئة (أدمن)
PUT    /api/v1/categories/:id       # تعديل فئة (أدمن)
DELETE /api/v1/categories/:id       # حذف فئة (أدمن)
```

### 📦 المنتجات
```http
GET    /api/v1/products             # جميع المنتجات
GET    /api/v1/products/trending    # المنتجات الرائجة
GET    /api/v1/products/my-products # منتجاتي
POST   /api/v1/products             # إضافة منتج
PUT    /api/v1/products/:id         # تعديل منتج
DELETE /api/v1/products/:id         # حذف منتج
PUT    /api/v1/products/:id/approve # اعتماد منتج (أدمن)
PUT    /api/v1/products/:id/reject  # رفض منتج (أدمن)
```

### 🛒 الطلبات
```http
GET  /api/v1/orders                 # جميع الطلبات
GET  /api/v1/orders/my-orders       # طلباتي
GET  /api/v1/orders/as-seller       # الطلبات كبائع
POST /api/v1/orders                 # إنشاء طلب
PUT  /api/v1/orders/:id/status      # تحديث حالة الطلب
PUT  /api/v1/orders/:id/cancel      # إلغاء طلب
```

### 🔄 التبادلات
```http
GET  /api/v1/exchanges              # جميع التبادلات
GET  /api/v1/exchanges/my-requests  # طلبات التبادل التي أرسلتها
GET  /api/v1/exchanges/on-my-products # طلبات التبادل على منتجاتي
POST /api/v1/exchanges              # إنشاء طلب تبادل
PUT  /api/v1/exchanges/:id/respond  # الرد على طلب تبادل
```

### 💰 المحافظ
```http
GET  /api/v1/wallets/my-wallet      # محفظتي
POST /api/v1/wallets/transfer       # تحويل أموال
GET  /api/v1/wallets/transactions   # تاريخ المعاملات
GET  /api/v1/wallets                # جميع المحافظ (أدمن)
POST /api/v1/wallets/:id/add-funds  # إيداع أموال (أدمن)
```

### 🔍 البحث
```http
GET /api/v1/search                  # البحث المتقدم
GET /api/v1/search/suggestions      # اقتراحات البحث
GET /api/v1/search/popular          # البحثات الشائعة
```

### 📊 لوحة تحكم الأدمن
```http
GET /api/v1/admin/dashboard         # إحصائيات عامة
GET /api/v1/admin/analytics         # تحليلات النظام
GET /api/v1/admin/revenue-analytics # تحليلات الإيرادات
GET /api/v1/admin/user-analytics    # تحليلات المستخدمين
GET /api/v1/admin/system-health     # صحة النظام
```

## 🧪 الاختبار

### اختبار سريع للخادم
```bash
curl http://localhost:8000/health
```

### اختبار تسجيل الدخول
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@badeel.com","password":"Admin@123456"}' \
  http://localhost:8000/api/v1/auth/login
```

### اختبار لوحة التحكم
```bash
# احصل على التوكن أولاً من تسجيل الدخول
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/admin/dashboard
```

## 🗄️ نماذج قاعدة البيانات

### User (المستخدمين)
- معلومات المستخدم الأساسية
- بيانات المصادقة
- الأدوار والصلاحيات

### Lab (المختبرات)  
- تفاصيل المختبر
- معلومات التسجيل والترخيص
- حالة الموافقة

### Product (المنتجات)
- معلومات المنتج والمواصفات
- الصور والملفات
- النوع (بيع/تبادل/أصول)

### Order (الطلبات)
- معاملات الشراء
- تتبع الحالة
- معلومات الدفع

### Exchange (التبادلات)
- طلبات تبادل المنتجات
- الحالة والتاريخ

### Wallet (المحافظ)
- أرصدة المستخدمين
- تاريخ المعاملات

## 🔒 الأمان المطبق

- **Rate Limiting**: حد أقصى 100 طلب/15 دقيقة
- **JWT Authentication**: مصادقة آمنة بالتوكن
- **MongoDB Injection Protection**: حماية من حقن قواعد البيانات
- **XSS Protection**: حماية من البرمجة النصية الضارة
- **HPP Protection**: حماية من تلوث المعاملات
- **Security Headers**: رؤوس أمان شاملة
- **Input Validation**: التحقق من صحة المدخلات
- **File Upload Security**: أمان رفع الملفات

## 🚀 الجاهزية للإنتاج

### المطلوب للنشر:
- [x] أمان متقدم مطبق
- [x] معالجة أخطاء شاملة
- [x] تسجيل العمليات (Logging)
- [x] ضغط الاستجابات
- [x] متغيرات بيئة منفصلة
- [x] صحة النظام مراقبة
- [x] توثيق شامل

### خطوات النشر المقترحة:
1. إعداد خادم Ubuntu/CentOS
2. تثبيت Node.js + MongoDB  
3. إعداد Nginx كـ Reverse Proxy
4. تكوين SSL Certificate
5. إعداد PM2 لإدارة العمليات
6. إعداد النسخ الاحتياطية
7. مراقبة الأداء والأخطاء

## 🤝 المساهمة

1. اتبع هيكل الكود الموجود
2. أضف validation مناسب للنقاط الجديدة
3. ضع معالجة أخطاء شاملة
4. حدث التوثيق
5. اختبر جميع التغييرات

## 📄 الترخيص

جميع الحقوق محفوظة © 2024 منصة بديل

---

## ✅ حالة المشروع: مكتمل ✅

🎉 **تم إنجاز جميع المتطلبات بنجاح!**

- **✅ جميع APIs جاهزة ومختبرة**
- **✅ أمان عالي المستوى مطبق** 
- **✅ قاعدة بيانات محسنة**
- **✅ توثيق شامل**
- **✅ جاهز للإنتاج**

**المنصة جاهزة للتطوير والتكامل مع الواجهة الأمامية! 🚀**