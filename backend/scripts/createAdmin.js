const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/badeel-platform');
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            process.exit(0);
        }

        // Create admin user
        const adminData = {
            name: 'مدير النظام',
            email: 'admin@badeel.com',
            password: 'Admin@123456',
            phone: '0501234567',
            role: 'admin',
            status: 'approved',
            isEmailVerified: true
        };

        const admin = await User.create(adminData);
        console.log('✅ Admin user created successfully');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: Admin@123456');
        console.log('👤 Role:', admin.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
