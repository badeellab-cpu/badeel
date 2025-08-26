const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    labName: {
        type: String,
        required: [true, 'يرجى إدخال اسم المختبر'],
        trim: true,
        maxlength: [200, 'اسم المختبر لا يمكن أن يتجاوز 200 حرف']
    },
    address: {
        type: String,
        required: [true, 'يرجى إدخال العنوان'],
        trim: true,
        maxlength: [300, 'العنوان لا يمكن أن يتجاوز 300 حرف']
    },
    postalCode: {
        type: String,
        required: [true, 'يرجى إدخال الرمز البريدي'],
        match: [/^\d{5}$/, 'الرمز البريدي يجب أن يكون 5 أرقام']
    },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number]
        }
    },
    registrationNumber: {
        type: String,
        required: [true, 'يرجى إدخال رقم السجل التجاري'],
        unique: true,
        match: [/^\d{10}$/, 'رقم السجل التجاري يجب أن يكون 10 أرقام']
    },
    licenseNumber: {
        type: String,
        required: [true, 'يرجى إدخال رقم ترخيص وزارة الصحة'],
        unique: true
    },
    registrationFile: String,
    licenseFile: String,
    additionalFiles: [{
        type: String
    }],
    description: {
        type: String,
        maxlength: [1000, 'الوصف لا يمكن أن يتجاوز 1000 حرف']
    },
    specializations: [{
        type: String
    }],
    workingHours: {
        sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        friday: { open: String, close: String, isOpen: { type: Boolean, default: false } },
        saturday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    contactPerson: {
        name: String,
        position: String,
        phone: String,
        email: String
    },
    socialMedia: {
        website: String,
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    bankAccount: {
        bankName: String,
        accountName: String,
        iban: {
            type: String,
            match: [/^SA\d{22}$/, 'IBAN غير صحيح']
        },
        accountNumber: String
    },
    statistics: {
        totalProducts: {
            type: Number,
            default: 0
        },
        totalSales: {
            type: Number,
            default: 0
        },
        totalPurchases: {
            type: Number,
            default: 0
        },
        totalExchanges: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewsCount: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        autoApproveExchanges: {
            type: Boolean,
            default: false
        },
        minimumOrderAmount: {
            type: Number,
            default: 0
        },
        deliveryAvailable: {
            type: Boolean,
            default: false
        },
        deliveryFee: {
            type: Number,
            default: 0
        },
        freeDeliveryThreshold: {
            type: Number,
            default: 0
        }
    },
    verificationDocuments: {
        taxCertificate: String,
        zatcaCertificate: String,
        chamberOfCommerceCertificate: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumUntil: Date,
    tags: [{
        type: String
    }],
    notes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
labSchema.index({ labName: 'text', description: 'text', address: 'text' });
labSchema.index({ registrationNumber: 1 });
labSchema.index({ licenseNumber: 1 });
labSchema.index({ location: '2dsphere' });

// fullAddress no longer needed with free-text address

// Method to calculate distance from coordinates
labSchema.methods.calculateDistance = function(lat, lng) {
    if (!this.location || !this.location.coordinates) {
        return null;
    }
    
    const [labLng, labLat] = this.location.coordinates;
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat - labLat) * Math.PI / 180;
    const dLon = (lng - labLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(labLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Pre save middleware to sanitize bank account
labSchema.pre('save', function(next) {
    if (this.bankAccount && this.bankAccount.iban) {
        // Remove spaces and convert to uppercase
        this.bankAccount.iban = this.bankAccount.iban.replace(/\s/g, '').toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Lab', labSchema);