const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate random string
exports.generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate OTP
exports.generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

// Sanitize filename
exports.sanitizeFilename = (filename) => {
    // Remove special characters and spaces
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

// Format currency
exports.formatCurrency = (amount, currency = 'SAR') => {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Calculate percentage
exports.calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
};

// Parse query filters
exports.parseQueryFilters = (query) => {
    const filters = {};
    
    // Parse status
    if (query.status) {
        filters.status = query.status;
    }
    
    // Parse date range
    if (query.startDate && query.endDate) {
        filters.createdAt = {
            $gte: new Date(query.startDate),
            $lte: new Date(query.endDate)
        };
    }
    
    // Parse price range
    if (query.minPrice || query.maxPrice) {
        filters.price = {};
        if (query.minPrice) filters.price.$gte = parseFloat(query.minPrice);
        if (query.maxPrice) filters.price.$lte = parseFloat(query.maxPrice);
    }
    
    // Parse search
    if (query.search) {
        filters.$text = { $search: query.search };
    }
    
    return filters;
};

// Build pagination
exports.buildPagination = (page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    return {
        page: pageNum,
        limit: limitNum,
        skip
    };
};

// Calculate pagination metadata
exports.calculatePaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
    };
};

// Generate unique order number
exports.generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
};

// Generate unique exchange number
exports.generateExchangeNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `EXC-${year}${month}${day}-${random}`;
};

// Clean Saudi phone number
exports.cleanSaudiPhone = (phone) => {
    // Remove country code if present
    let cleanPhone = phone.replace(/^\+966/, '');
    cleanPhone = cleanPhone.replace(/^966/, '');
    
    // Add 0 if not present
    if (!cleanPhone.startsWith('0')) {
        cleanPhone = '0' + cleanPhone;
    }
    
    // Remove any non-numeric characters
    return cleanPhone.replace(/\D/g, '');
};

// Validate Saudi phone number
exports.isValidSaudiPhone = (phone) => {
    const saudiPhoneRegex = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
    const cleanPhone = this.cleanSaudiPhone(phone);
    return saudiPhoneRegex.test(cleanPhone);
};

// Validate IBAN
exports.isValidIBAN = (iban) => {
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
    const ibanRegex = /^SA\d{22}$/;
    return ibanRegex.test(cleanIBAN);
};

// Calculate distance between coordinates
exports.calculateDistance = (lat1, lon1, lat2, lon2, unit = 'K') => {
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + 
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    
    if (dist > 1) {
        dist = 1;
    }
    
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    
    if (unit === 'K') { dist = dist * 1.609344; } // Kilometers
    if (unit === 'N') { dist = dist * 0.8684; } // Nautical miles
    
    return dist;
};

// Generate slug from Arabic text
exports.generateSlug = (text) => {
    // Simple transliteration for common Arabic letters
    const arabicToEnglish = {
        'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a',
        'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
        'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
        'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
        'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h',
        'ى': 'a', 'ئ': 'e', 'ؤ': 'o', 'ء': 'a'
    };
    
    let slug = text.toLowerCase();
    
    // Replace Arabic characters
    for (const [arabic, english] of Object.entries(arabicToEnglish)) {
        slug = slug.replace(new RegExp(arabic, 'g'), english);
    }
    
    // Replace spaces and special characters
    slug = slug
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    
    // Add timestamp to ensure uniqueness
    slug = `${slug}-${Date.now().toString(36)}`;
    
    return slug;
};

// Parse boolean from string
exports.parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return !!value;
};

// Get date range for period
exports.getDateRangeForPeriod = (period) => {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            now.setDate(now.getDate() - 1);
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return { startDate, endDate: now };
};