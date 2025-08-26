const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
    constructor() {
        // Disable in development or when credentials are missing
        if (config.server?.env !== 'production') {
            this.transporter = null;
            console.log('EmailService: disabled in non-production environment.');
        } else if (config.email && config.email.user && config.email.pass) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.secure,
                auth: {
                    user: config.email.user,
                    pass: config.email.pass
                }
            });
        } else {
            this.transporter = null;
            console.log('EmailService: transporter disabled (no email credentials provided).');
        }
    }

    async sendEmail(options) {
        // In development or when no transporter, skip sending
        if (!this.transporter) {
            console.log('EmailService: Email disabled. Skipping sendEmail to:', options.to || options.email);
            return { messageId: 'dev-disabled', skipped: true };
        }
        const mailOptions = {
            from: options.from || config.email.from,
            to: options.to || options.email,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Email error:', error);
            // Do not crash requests due to email errors
            return { error: true, message: error.message };
        }
    }

    // Email templates
    async sendWelcomeEmail(user, verificationToken) {
        const verificationUrl = `${config.frontend.url}/verify-email/${verificationToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>مرحباً ${user.name}</h2>
                <p>شكراً لتسجيلك في منصة بديل.</p>
                <p>لتفعيل حسابك، يرجى النقر على الرابط التالي:</p>
                <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">تفعيل الحساب</a>
                <p>أو انسخ الرابط التالي:</p>
                <p>${verificationUrl}</p>
                <p>هذا الرابط صالح لمدة 24 ساعة.</p>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: 'تفعيل حساب منصة بديل',
            html
        });
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${config.frontend.url}/reset-password/${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>مرحباً ${user.name}</p>
                <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
                <p>لإعادة تعيين كلمة المرور، يرجى النقر على الرابط التالي:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>
                <p>أو انسخ الرابط التالي:</p>
                <p>${resetUrl}</p>
                <p>هذا الرابط صالح لمدة 10 دقائق.</p>
                <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: 'إعادة تعيين كلمة المرور - منصة بديل',
            html
        });
    }

    async sendLabApprovedEmail(lab) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>تم اعتماد مختبركم</h2>
                <p>مرحباً ${lab.labName}</p>
                <p>يسرنا إبلاغكم بأنه تم اعتماد مختبركم في منصة بديل.</p>
                <p>يمكنكم الآن تسجيل الدخول والبدء في استخدام المنصة.</p>
                <a href="${config.frontend.url}/login" style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">تسجيل الدخول</a>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: lab.user.email,
            subject: 'تم اعتماد مختبركم - منصة بديل',
            html
        });
    }

    async sendLabRejectedEmail(lab, reason) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>طلب التسجيل</h2>
                <p>مرحباً ${lab.labName}</p>
                <p>نأسف لإبلاغكم بأنه تم رفض طلب تسجيل مختبركم في منصة بديل.</p>
                <p><strong>السبب:</strong> ${reason}</p>
                <p>يمكنكم التواصل معنا لمزيد من المعلومات أو إعادة التقديم بعد معالجة السبب.</p>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: lab.user.email,
            subject: 'طلب التسجيل - منصة بديل',
            html
        });
    }

    async sendOrderConfirmationEmail(order) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>تأكيد الطلب</h2>
                <p>رقم الطلب: ${order.orderNumber}</p>
                <p>تم استلام طلبكم بنجاح وجاري معالجته.</p>
                <h3>تفاصيل الطلب:</h3>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} - الكمية: ${item.quantity} - السعر: ${item.total} ريال</li>
                    `).join('')}
                </ul>
                <p><strong>المجموع: ${order.total} ريال</strong></p>
                <p>يمكنكم متابعة حالة الطلب من خلال لوحة التحكم.</p>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: order.buyer.user.email,
            subject: `تأكيد الطلب ${order.orderNumber} - منصة بديل`,
            html
        });
    }

    async sendExchangeRequestEmail(exchange) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>طلب تبادل جديد</h2>
                <p>لديك طلب تبادل جديد رقم: ${exchange.exchangeNumber}</p>
                <p>من: ${exchange.requester.lab.labName}</p>
                <p>المنتج المطلوب: ${exchange.receiverProduct.product.name}</p>
                <p>المنتج المعروض: ${exchange.requesterProduct.product.name}</p>
                <p>يمكنك الرد على الطلب من خلال لوحة التحكم.</p>
                <a href="${config.frontend.url}/dashboard/exchanges/${exchange._id}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">عرض الطلب</a>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: exchange.receiver.user.email,
            subject: `طلب تبادل جديد ${exchange.exchangeNumber} - منصة بديل`,
            html
        });
    }

    async sendWithdrawalProcessedEmail(transaction) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>تم معالجة طلب السحب</h2>
                <p>رقم المعاملة: ${transaction.transactionId}</p>
                <p>المبلغ: ${transaction.amount} ريال</p>
                <p>الحالة: تم التحويل بنجاح</p>
                <p>تم تحويل المبلغ إلى حسابكم البنكي المسجل.</p>
                <p>قد يستغرق وصول المبلغ من 1-3 أيام عمل حسب البنك.</p>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: transaction.lab.user.email,
            subject: 'تم معالجة طلب السحب - منصة بديل',
            html
        });
    }

    async sendProductApprovedEmail(product) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>تم اعتماد المنتج</h2>
                <p>تم اعتماد المنتج "${product.name}" ونشره في المنصة.</p>
                <p>يمكن للمختبرات الأخرى الآن مشاهدة المنتج والتفاعل معه.</p>
                <a href="${config.frontend.url}/products/${product.slug}" style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">عرض المنتج</a>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: product.owner.email,
            subject: 'تم اعتماد المنتج - منصة بديل',
            html
        });
    }

    async sendLowStockAlert(product) {
        const html = `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>تنبيه: مخزون منخفض</h2>
                <p>المنتج "${product.name}" وصل إلى حد المخزون المنخفض.</p>
                <p>الكمية المتبقية: ${product.quantity} ${product.unit}</p>
                <p>يُنصح بتحديث المخزون لتجنب نفاد المنتج.</p>
                <a href="${config.frontend.url}/dashboard/products/${product._id}" style="display: inline-block; padding: 10px 20px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 5px;">إدارة المنتج</a>
                <hr>
                <p>مع تحيات فريق منصة بديل</p>
            </div>
        `;

        return this.sendEmail({
            to: product.owner.email,
            subject: 'تنبيه: مخزون منخفض - منصة بديل',
            html
        });
    }
}

module.exports = new EmailService();