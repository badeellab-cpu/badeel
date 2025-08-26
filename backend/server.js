// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Import custom middleware
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

// Import security middleware
const {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    passwordResetLimiter,
    emailVerificationLimiter,
    securityHeaders,
    mongoSanitize,
    xssClean,
    hppProtection,
    securityMiddleware,
    suspiciousActivityDetector,
    corsOptions,
    requestSizeLimit
} = require('./src/middleware/security');

// Import routes
const authRoutes = require('./src/routes/auth');
const labRoutes = require('./src/routes/labs');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const orderRoutes = require('./src/routes/orders');
const exchangeRoutes = require('./src/routes/exchanges');
const exchangeRequestRoutes = require('./src/routes/exchangeRequests');
const walletRoutes = require('./src/routes/wallets');
const adminRoutes = require('./src/routes/admin');
const publicRoutes = require('./src/routes/public');
const searchRoutes = require('./src/routes/search');
const paymentRoutes = require('./src/routes/payments');

// Initialize express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);
app.use(securityMiddleware);

// CORS configuration
app.use(cors(corsOptions));

// Request size limiting
app.use(requestSizeLimit('10mb'));

// MongoDB injection and XSS protection
app.use(mongoSanitize);
app.use(xssClean);

// HTTP Parameter Pollution protection
app.use(hppProtection);

// Suspicious activity detection
app.use(suspiciousActivityDetector);

// General rate limiting
app.use('/api/', generalLimiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/labs`, labRoutes);
app.use(`/api/${apiVersion}/products`, productRoutes);
app.use(`/api/${apiVersion}/categories`, categoryRoutes);
app.use(`/api/${apiVersion}/orders`, orderRoutes);
app.use(`/api/${apiVersion}/exchanges`, exchangeRoutes);
app.use(`/api/${apiVersion}/exchange-requests`, exchangeRequestRoutes);
app.use(`/api/${apiVersion}/wallets`, walletRoutes);
app.use(`/api/${apiVersion}/admin`, adminRoutes);
app.use(`/api/${apiVersion}/public`, publicRoutes);
app.use(`/api/${apiVersion}/search`, searchRoutes);
app.use(`/api/${apiVersion}/payments`, paymentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badeel_platform', {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // These options are deprecated in Mongoose 6+
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Create default admin user on first run
        const User = require('./src/models/User');
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(
                process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
                parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
            );

            await User.create({
                name: 'مدير النظام',
                email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@badeel.com',
                password: hashedPassword,
                phone: '0500000000',
                role: 'admin',
                isEmailVerified: true,
                status: 'approved'
            });

            console.log('Default admin user created');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app;