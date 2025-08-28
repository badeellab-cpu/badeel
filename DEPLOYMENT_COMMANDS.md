# أوامر النشر السريع

## 1. رفع التغييرات إلى GitHub
```bash
git add .
git commit -m "وصف التغييرات"
git push origin main
```

## 2. بناء الفرونت اند محلياً
```bash
cd badeel-platform
npm run build
tar -czf frontend-build-fix.tar.gz build/
```

## 3. رفع build الفرونت اند إلى السيرفر
```bash
scp -i ~/Desktop/bade.pem badeel-platform/frontend-build-fix.tar.gz ubuntu@13.60.160.102:/tmp/
```

## 4. تحديث السيرفر
```bash
# سحب آخر التحديثات من GitHub
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "cd /var/www/badeel && sudo git pull origin main"

# تحديث الفرونت اند
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "cd /tmp && sudo rm -rf /var/www/html/* && sudo tar -xzf frontend-build-fix.tar.gz && sudo cp -r build/* /var/www/html/ && sudo chown -R www-data:www-data /var/www/html/"

# إعادة تشغيل الخدمات
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "sudo pm2 restart all"
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "sudo systemctl reload nginx"
```

## 5. التحقق من حالة الخدمات
```bash
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "sudo pm2 list"
ssh -i ~/Desktop/bade.pem ubuntu@13.60.160.102 "sudo systemctl status nginx --no-pager"
```

## ملاحظات
- IP السيرفر: `13.60.160.102`
- مفتاح SSH: `~/Desktop/bade.pem`
- رابط الموقع: `http://13.60.160.102`
