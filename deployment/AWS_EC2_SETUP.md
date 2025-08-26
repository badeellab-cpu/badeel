# دليل إعداد AWS EC2 لمنصة بديل

## 🚀 إعداد EC2 Instance

### الخطوة 1: إنشاء EC2 Instance

1. **تسجيل الدخول إلى AWS Console**
   - انتقل إلى [AWS Console](https://aws.amazon.com/console/)
   - سجل دخولك أو أنشئ حساب جديد

2. **انتقل إلى خدمة EC2**
   - في البحث اكتب "EC2"
   - اختر "EC2" من النتائج

3. **إطلاق Instance جديد**
   - اضغط على "Launch Instance"
   - أدخل اسم للـ Instance: `badeel-server`

### الخطوة 2: اختيار المواصفات

4. **اختيار نظام التشغيل (AMI)**
   ```
   Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   Architecture: 64-bit (x86)
   ```

5. **اختيار نوع Instance**
   ```
   Instance Type: t3.medium
   vCPUs: 2
   Memory: 4 GiB
   Network Performance: Up to 5 Gigabit
   ```

6. **إعداد Key Pair**
   - اختر "Create a new key pair"
   - Name: `badeel-server-key`
   - Type: RSA
   - Format: .pem
   - اضغط "Create key pair" وحفظ الملف

### الخطوة 3: إعداد الشبكة والأمان

7. **Network Settings**
   ```
   VPC: Default VPC
   Subnet: Default subnet
   Auto-assign public IP: Enable
   ```

8. **Security Group (Firewall)**
   - اختر "Create security group"
   - Name: `badeel-security-group`
   - Description: `Security group for Badeel platform`
   
   **Inbound Rules:**
   ```
   Type: SSH, Port: 22, Source: My IP
   Type: HTTP, Port: 80, Source: Anywhere (0.0.0.0/0)
   Type: HTTPS, Port: 443, Source: Anywhere (0.0.0.0/0)
   Type: Custom TCP, Port: 5000, Source: My IP (للاختبار فقط)
   ```

### الخطوة 4: إعداد التخزين

9. **Configure Storage**
   ```
   Volume Type: gp3
   Size: 20 GiB
   IOPS: 3000
   Throughput: 125 MB/s
   ```

10. **المراجعة والإطلاق**
    - راجع جميع الإعدادات
    - اضغط "Launch instance"

---

## 🔧 إعداد Elastic IP

### الخطوة 5: إنشاء Elastic IP

1. **في لوحة EC2 Console**
   - انتقل إلى "Network & Security" > "Elastic IPs"
   - اضغط "Allocate Elastic IP address"
   - اختر "Amazon's pool of IPv4 addresses"
   - اضغط "Allocate"

2. **ربط Elastic IP بالـ Instance**
   - اختر الـ Elastic IP الجديد
   - اضغط "Actions" > "Associate Elastic IP address"
   - اختر Instance: `badeel-server`
   - اضغط "Associate"

---

## 🔐 الاتصال بالخادم

### الخطوة 6: الاتصال عبر SSH

1. **على macOS/Linux:**
   ```bash
   chmod 400 badeel-server-key.pem
   ssh -i "badeel-server-key.pem" ubuntu@YOUR_ELASTIC_IP
   ```

2. **على Windows (PowerShell):**
   ```powershell
   ssh -i "badeel-server-key.pem" ubuntu@YOUR_ELASTIC_IP
   ```

3. **باستخدام PuTTY على Windows:**
   - حول .pem إلى .ppk باستخدام PuTTYgen
   - استخدم PuTTY للاتصال

---

## 🛠️ تثبيت المشروع

### الخطوة 7: تشغيل script الإعداد

```bash
# تحديث النظام أولاً
sudo apt update && sudo apt upgrade -y

# تحميل وتشغيل script الإعداد
wget https://raw.githubusercontent.com/badeellab-cpu/badeel/main/deployment/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

**أو يدوياً:**

```bash
# استنساخ المشروع
cd /var/www
sudo git clone https://github.com/badeellab-cpu/badeel.git
sudo chown -R ubuntu:ubuntu badeel

# تشغيل script الإعداد
cd badeel/deployment
sudo chmod +x server-setup.sh
./server-setup.sh
```

---

## 🌐 إعداد النطاق والـ SSL

### الخطوة 8: ربط النطاق

1. **في إعدادات النطاق (Domain registrar):**
   ```
   Type: A Record
   Name: @
   Value: YOUR_ELASTIC_IP
   TTL: 300
   
   Type: A Record  
   Name: www
   Value: YOUR_ELASTIC_IP
   TTL: 300
   ```

2. **تحديث إعدادات Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/badeel
   
   # غيّر your-domain.com إلى نطاقك الفعلي
   server_name yourdomain.com www.yourdomain.com;
   ```

### الخطوة 9: تثبيت SSL Certificate

```bash
# تثبيت SSL باستخدام Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# التجديد التلقائي
sudo crontab -e
# أضف هذا السطر:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 مراقبة الخادم

### الخطوة 10: إعداد المراقبة

```bash
# حالة التطبيق
pm2 status
pm2 monit

# حالة النظام
htop
df -h
free -m

# سجلات التطبيق
pm2 logs badeel-backend
sudo tail -f /var/log/nginx/badeel_error.log

# اختبار التطبيق
curl http://localhost:5000/health
curl https://yourdomain.com
```

---

## 🔄 النشر والتحديث

### نشر التحديثات:

```bash
cd /var/www/badeel
./deployment/deploy.sh
```

### التراجع عن النشر:

```bash
./deployment/deploy.sh rollback
```

### عرض حالة التطبيق:

```bash
./deployment/deploy.sh status
```

---

## 💰 تقدير التكلفة الشهرية

### AWS EC2 t3.medium:
- **Instance Cost:** ~$30.37/شهر
- **EBS Storage (20GB):** ~$2.00/شهر  
- **Data Transfer:** حسب الاستخدام (~$0.09/GB)
- **Elastic IP:** مجاني عند الاستخدام

### المجموع المتوقع: $35-50/شهر

---

## ⚠️ نصائح أمنية مهمة

1. **غيّر كلمات المرور الافتراضية:**
   ```bash
   sudo nano /var/www/badeel/backend/.env
   # غيّر ADMIN_DEFAULT_PASSWORD وجميع كلمات المرور
   ```

2. **إعداد النسخ الاحتياطية:**
   ```bash
   # نسخة احتياطية يدوية
   ./deployment/deploy.sh backup
   
   # نسخة احتياطية مجدولة
   sudo crontab -e
   # أضف: 0 2 * * * /var/www/badeel/deployment/deploy.sh backup
   ```

3. **مراقبة السجلات:**
   ```bash
   # إعداد log rotation
   sudo nano /etc/logrotate.d/badeel
   ```

4. **تحديث النظام بانتظام:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo reboot  # إذا لزم الأمر
   ```

---

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:

1. **التطبيق لا يعمل:**
   ```bash
   pm2 restart badeel-backend
   sudo systemctl restart nginx
   ```

2. **قاعدة البيانات لا تعمل:**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

3. **مشاكل SSL:**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

4. **مشاكل الذاكرة:**
   ```bash
   free -m
   pm2 restart badeel-backend
   ```

---

## 📞 الحصول على المساعدة

- **AWS Support:** [AWS Support Center](https://console.aws.amazon.com/support/)
- **Let's Encrypt:** [Community Support](https://community.letsencrypt.org/)
- **MongoDB:** [MongoDB Community](https://www.mongodb.com/community/forums/)

---

**🎉 مبروك! منصة بديل الآن جاهزة للعمل على AWS EC2**
