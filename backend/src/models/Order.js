const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    buyer: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lab',
            required: true
        }
    },
    seller: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lab',
            required: true
        }
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lab'
        },
        name: String,
        productName: String,
        productImage: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        fullName: String,
        phone: String,
        email: String,
        address: String,
        city: String,
        region: String,
        postalCode: String,
        additionalInfo: String
    },
    shipping: {
        method: {
            type: String,
            enum: ['pickup', 'delivery'],
            default: 'delivery'
        },
        fee: {
            type: Number,
            default: 0
        },
        estimatedDelivery: Date,
        trackingNumber: String,
        carrier: String
    },
    payment: {
        method: {
            type: String,
            enum: ['wallet', 'credit_card', 'bank_transfer', 'cash', 'cod', 'card'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'paid', 'cod'],
            default: 'pending'
        },
        transactionId: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number,
        amount: Number,
        currency: {
            type: String,
            default: 'SAR'
        },
        quantitiesUpdated: {
            type: Boolean,
            default: false
        }
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    notes: String,
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'completed',
            'cancelled',
            'refunded'
        ],
        default: 'pending'
    },
    statusHistory: [{
        status: String,
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: {
        buyer: String,
        seller: String,
        admin: String
    },
    invoice: {
        number: String,
        url: String,
        generatedAt: Date
    },
    rating: {
        value: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        ratedAt: Date
    },
    dispute: {
        isDisputed: {
            type: Boolean,
            default: false
        },
        reason: String,
        openedAt: Date,
        resolvedAt: Date,
        resolution: String
    },
    metadata: {
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        },
        ipAddress: String,
        userAgent: String
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,
    cancellationReason: String,
    completedAt: Date,
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'buyer.user': 1, createdAt: -1 });
orderSchema.index({ 'seller.user': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderNumber = `ORD-${year}${month}${day}-${random}`;
    }

    // Normalize items totals
    if (Array.isArray(this.items)) {
        this.items = this.items.map((item) => ({
            ...item,
            total: typeof item.total === 'number' ? item.total : (item.price || 0) * (item.quantity || 0)
        }));
    }

    // Calculate derived amounts only if not provided
    if (this.isNew || this.isModified('items')) {
        this.subtotal = this.items.reduce((sum, item) => sum + (item.total || 0), 0);
    }

    if (typeof this.shippingFee !== 'number') this.shippingFee = 0;
    if (typeof this.taxAmount !== 'number') this.taxAmount = 0;
    if (typeof this.discount !== 'number') this.discount = 0;

    if (typeof this.totalAmount !== 'number' || this.isNew || this.isModified('items')) {
        this.totalAmount = Math.max(0, this.subtotal + this.shippingFee + this.taxAmount - this.discount);
    }

    // Add to status history
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            updatedAt: new Date()
        });
    }

    next();
});

// Update product quantities after order status changes
orderSchema.post('save', async function(doc, next) {
    const Product = mongoose.model('Product');
    
    if (doc.status === 'confirmed' && this.modifiedPaths().includes('status')) {
        // Decrease product quantities
        for (const item of doc.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: -item.quantity }
            });
        }
    } else if (doc.status === 'cancelled' && this.modifiedPaths().includes('status')) {
        // Restore product quantities
        for (const item of doc.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity }
            });
        }
    }
    
    next();
});

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
    const nonCancellableStatuses = ['shipped', 'delivered', 'completed', 'cancelled', 'refunded'];
    return !nonCancellableStatuses.includes(this.status);
};

// Method to check if order can be refunded
orderSchema.methods.canBeRefunded = function() {
    return this.status === 'completed' && 
           this.payment.status === 'completed' && 
           this.ageInDays <= 30; // 30 days refund policy
};

// Static method to get order statistics for a lab
orderSchema.statics.getLabStatistics = async function(labId, startDate, endDate) {
    const match = {
        $or: [
            { 'buyer.lab': labId },
            { 'seller.lab': labId }
        ],
        status: { $ne: 'cancelled' }
    };
    
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: {
                    $sum: {
                        $cond: [
                            { $eq: ['$seller.lab', labId] },
                            '$total',
                            0
                        ]
                    }
                },
                totalSpent: {
                    $sum: {
                        $cond: [
                            { $eq: ['$buyer.lab', labId] },
                            '$total',
                            0
                        ]
                    }
                },
                completedOrders: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'completed'] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalSpent: 0,
        completedOrders: 0
    };
};

module.exports = mongoose.model('Order', orderSchema);