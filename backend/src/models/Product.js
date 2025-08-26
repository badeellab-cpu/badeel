const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'يرجى إدخال اسم المنتج'],
        trim: true,
        maxlength: [200, 'اسم المنتج لا يمكن أن يتجاوز 200 حرف']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'يرجى إدخال وصف المنتج'],
        maxlength: [2000, 'الوصف لا يمكن أن يتجاوز 2000 حرف']
    },
    type: {
        type: String,
        enum: ['sale', 'exchange', 'asset'],
        required: [true, 'يرجى تحديد نوع المنتج']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'يرجى اختيار الفئة']
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
        type: Number,
        required: function() {
            return this.type === 'sale';
        },
        min: [0, 'السعر لا يمكن أن يكون سالباً']
    },
    currency: {
        type: String,
        default: 'SAR',
        enum: ['SAR', 'USD', 'EUR']
    },
    quantity: {
        type: Number,
        required: [true, 'يرجى إدخال الكمية'],
        min: [0, 'الكمية لا يمكن أن تكون سالبة']
    },
    unit: {
        type: String,
        default: 'قطعة'
    },
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    barcode: String,
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    specifications: [{
        name: String,
        value: String,
        unit: String
    }],
    condition: {
        type: String,
        enum: ['new', 'like_new', 'like-new', 'good', 'fair', 'poor'],
        default: 'new'
    },
    brand: String,
    model: String,
    manufacturerCountry: String,
    manufacturingDate: Date,
    expiryDate: Date,
    warranty: {
        available: {
            type: Boolean,
            default: false
        },
        duration: Number,
        unit: {
            type: String,
            enum: ['days', 'months', 'years']
        },
        description: String
    },

    exchangePreferences: {
        preferredCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        preferredProducts: [String],
        notes: String
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'exchanged'],
        default: 'pending'
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: String,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    views: {
        type: Number,
        default: 0
    },
    favorites: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    tags: [String],
    relatedProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isPromoted: {
        type: Boolean,
        default: false
    },
    promotedUntil: Date,
    discounts: [{
        percentage: Number,
        amount: Number,
        startDate: Date,
        endDate: Date,
        minQuantity: Number
    }],
    metadata: {
        soldCount: {
            type: Number,
            default: 0
        },
        exchangedCount: {
            type: Number,
            default: 0
        },
        lastSoldAt: Date,
        lastExchangedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
productSchema.index({ slug: 1 });
productSchema.index({ lab: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ type: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for current price (after discounts)
productSchema.virtual('currentPrice').get(function() {
    if (this.type !== 'sale' || !this.price) {
        return null;
    }
    
    let finalPrice = this.price;
    const now = new Date();
    
    // Apply active discounts
    const activeDiscounts = this.discounts.filter(d => 
        d.startDate <= now && d.endDate >= now
    );
    
    if (activeDiscounts.length > 0) {
        // Apply the best discount
        let bestDiscount = 0;
        
        activeDiscounts.forEach(discount => {
            let discountAmount = 0;
            if (discount.percentage) {
                discountAmount = this.price * (discount.percentage / 100);
            } else if (discount.amount) {
                discountAmount = discount.amount;
            }
            
            if (discountAmount > bestDiscount) {
                bestDiscount = discountAmount;
            }
        });
        
        finalPrice = this.price - bestDiscount;
    }
    
    return Math.max(0, finalPrice);
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
    return this.status === 'active' && 
           this.approvalStatus === 'approved' && 
           this.quantity > 0;
});

// Generate slug before saving
productSchema.pre('save', function(next) {
    if (!this.slug || this.isModified('name')) {
        this.slug = slugify(this.name, {
            replacement: '-',
            lower: true,
            strict: true,
            locale: 'ar'
        });
        
        // Add random string to ensure uniqueness
        this.slug = `${this.slug}-${Date.now().toString(36)}`;
    }
    
    // Generate SKU if not provided
    if (!this.sku) {
        this.sku = `${this.lab.toString().slice(-4)}-${Date.now().toString(36).toUpperCase()}`;
    }
    
    // Ensure only one primary image
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0 && this.images.length > 0) {
        this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
        this.images.forEach((img, index) => {
            img.isPrimary = index === 0;
        });
    }
    
    next();
});

// Update category products count after save
productSchema.post('save', async function(doc) {
    if (doc.category) {
        await mongoose.model('Category').updateProductsCount(doc.category);
    }
});

// Update category products count after remove
productSchema.post('remove', async function(doc) {
    if (doc.category) {
        await mongoose.model('Category').updateProductsCount(doc.category);
    }
});

// Method to increment views
productSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
};

// Method to check if can be exchanged with another product
productSchema.methods.canExchangeWith = function(otherProduct) {
    if (this.type !== 'exchange' || otherProduct.type !== 'exchange') {
        return false;
    }
    
    if (this.status !== 'active' || otherProduct.status !== 'active') {
        return false;
    }
    
    if (this.lab.toString() === otherProduct.lab.toString()) {
        return false;
    }
    
    return true;
};

// Static method to get trending products
productSchema.statics.getTrending = async function(limit = 10) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return this.find({
        status: 'active',
        approvalStatus: 'approved',
        createdAt: { $gte: oneWeekAgo }
    })
    .sort('-views -favorites -rating.average')
    .limit(limit)
    .populate('category lab');
};

module.exports = mongoose.model('Product', productSchema);