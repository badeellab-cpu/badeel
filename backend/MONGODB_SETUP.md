# إعداد MongoDB لمنصة بديل

## الخيار 1: تثبيت MongoDB محلياً (الأسهل)

### على macOS باستخدام Homebrew:
```bash
# تثبيت Homebrew إذا لم يكن مثبتاً
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# تثبيت MongoDB
brew tap mongodb/brew
brew install mongodb-community

# تشغيل MongoDB
brew services start mongodb-community

# للتحقق من عمل MongoDB
brew services list
```

## الخيار 2: استخدام MongoDB Atlas (مجاني - سحابي)

1. اذهب إلى https://www.mongodb.com/atlas
2. أنشئ حساب مجاني
3. أنشئ Cluster مجاني
4. احصل على connection string
5. استبدل MONGODB_URI في ملف .env بالـ connection string

مثال:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/badeel_platform?retryWrites=true&w=majority
```

## الخيار 3: استخدام Docker (إذا كان لديك Docker)

```bash
# تثبيت Docker Desktop من https://www.docker.com/products/docker-desktop/

# ثم شغل MongoDB باستخدام docker-compose
docker-compose up -d
```

## الخيار 4: تثبيت MongoDB يدوياً

1. اذهب إلى https://www.mongodb.com/try/download/community
2. حمل النسخة المناسبة لـ macOS
3. اتبع تعليمات التثبيت

## للتطوير السريع - استخدم MongoDB في الذاكرة

يمكنك استخدام mongodb-memory-server للتطوير:

```bash
npm install --save-dev mongodb-memory-server
```

ثم عدل server.js لاستخدامه في بيئة التطوير.