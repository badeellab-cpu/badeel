# منصة بديل - Badeel Platform

<div align="center">
  <h3>منصة التبادل والبيع للمختبرات الطبية</h3>
  <p>الحل الأمثل للمختبرات للتبادل أو بيع المنتجات بكل أمان وخصوصية</p>
</div>

## 🚀 نظرة عامة

منصة بديل هي منصة متكاملة تمكن المختبرات الطبية من:
- تبادل الأجهزة والمنتجات الطبية
- البيع والشراء بأمان
- إدارة المخزون والطلبات
- نظام دفع متكامل مع ميسر

## 🛠️ التقنيات المستخدمة

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Moyasar Payment Gateway
- Multer (File Upload)
- Nodemailer (Email)

### Frontend
- React 18 + TypeScript
- Redux Toolkit
- Tailwind CSS
- Framer Motion
- React Router
- Axios

## 📁 هيكل المشروع

```
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Controllers
│   │   ├── models/         # Database Models
│   │   ├── routes/         # API Routes
│   │   ├── middleware/     # Middleware
│   │   └── utils/          # Utilities
│   ├── uploads/            # File Uploads
│   └── server.js           # Main Server File
│
├── badeel-platform/        # Frontend React App
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── pages/          # Page Components
│   │   ├── store/          # Redux Store
│   │   └── services/       # API Services
│   └── public/             # Static Files
│
└── deployment/             # Deployment Files
    ├── ecosystem.config.js # PM2 Configuration
    ├── nginx.conf          # Nginx Configuration
    └── deploy.sh           # Deployment Script
```

## 🚀 التثبيت والتشغيل

### متطلبات النظام
- Node.js 18+
- MongoDB 6+
- npm أو yarn

### Backend
```bash
cd backend
npm install
cp env.example .env
# قم بتعديل ملف .env
npm run dev
```

### Frontend
```bash
cd badeel-platform
npm install
npm start
```

## 🔧 إعداد الإنتاج

### متغيرات البيئة
قم بإعداد المتغيرات التالية في ملف `.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/badeel_platform

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# Moyasar Payment
MOYASAR_PUBLIC_KEY=pk_test_xxx
MOYASAR_SECRET_KEY=sk_test_xxx

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### النشر على AWS EC2

1. **إعداد الخادم:**
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install mongodb-org

# تثبيت Nginx
sudo apt install nginx

# تثبيت PM2
sudo npm install -g pm2
```

2. **استنساخ المشروع:**
```bash
git clone https://github.com/badeellab-cpu/badeel.git
cd badeel
```

3. **تشغيل التطبيق:**
```bash
# Backend
cd backend
npm install --production
pm2 start ecosystem.config.js

# Frontend
cd ../badeel-platform
npm install
npm run build
sudo cp -r build/* /var/www/html/
```

## 🔐 الأمان

- حماية من XSS و NoSQL Injection
- Rate Limiting
- JWT Authentication
- HTTPS/SSL
- Secure File Upload
- Input Validation

## 📊 الميزات المكتملة

✅ نظام المصادقة والتخويل  
✅ إدارة المختبرات والمنتجات  
✅ نظام الطلبات والمبيعات  
✅ نظام التبادل  
✅ المحافظ والمعاملات  
✅ بوابة دفع ميسر  
✅ لوحة تحكم الأدمن  
✅ البحث المتقدم  
✅ الأمان المتقدم  
✅ نظام الإشعارات  

## 📞 الدعم

للمساعدة والدعم:
- Email: support@badeel.com
- GitHub Issues: [Create Issue](https://github.com/badeellab-cpu/badeel/issues)

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة ISC.

---

**🎉 منصة بديل - الحل الأمثل للمختبرات الطبية**
