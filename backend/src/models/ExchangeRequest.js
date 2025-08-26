const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
    requestNumber: {
        type: String,
        unique: true
    },
    requesterLab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    targetProduct: {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        ownerLab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lab',
            required: true
        },
        requestedQuantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    offerType: {
        type: String,
        enum: ['existing_product', 'custom_offer'],
        required: true
    },
    // إذا كان العرض منتج موجود
    offeredProduct: {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            min: 1
        }
    },
    // إذا كان العرض مخصص
    customOffer: {
        name: String,
        description: String,
        condition: {
            type: String,
            enum: ['new', 'like-new', 'good', 'fair', 'poor']
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1
        },
        estimatedValue: Number,
        currency: {
            type: String,
            default: 'SAR'
        },
        images: [{
            url: String,
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
        brand: String,
        model: String,
        manufacturingDate: Date,
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
        }
    },
    message: {
        type: String,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: [
            'pending',      // في انتظار المراجعة
            'viewed',       // تم عرضه
            'accepted',     // تم قبوله (سيتم إنشاء Exchange)
            'rejected',     // تم رفضه
            'counter_offer', // عرض مضاد
            'expired',      // منتهي الصلاحية
            'withdrawn'     // تم سحبه
        ],
        default: 'pending'
    },
    counterOffer: {
        message: String,
        proposedQuantity: Number,
        additionalTerms: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    rejectionReason: String,
    viewedAt: Date,
    respondedAt: Date,
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    },
    withdrawnAt: Date,
    withdrawalReason: String,
    // إذا تم القبول، رقم التبادل المنشأ
    exchangeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange'
    },
    metadata: {
        source: {
            type: String,
            enum: ['web', 'mobile', 'api'],
            default: 'web'
        },
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
exchangeRequestSchema.index({ requestNumber: 1 });
exchangeRequestSchema.index({ requesterLab: 1, createdAt: -1 });
exchangeRequestSchema.index({ 'targetProduct.ownerLab': 1, status: 1, createdAt: -1 });
exchangeRequestSchema.index({ status: 1 });
exchangeRequestSchema.index({ expiresAt: 1 });
exchangeRequestSchema.index({ createdAt: -1 });

// Generate request number before saving
exchangeRequestSchema.pre('validate', function(next) {
    if (!this.requestNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.requestNumber = `REQ-${year}${month}${day}-${random}`;
    }
    next();
});

exchangeRequestSchema.pre('save', async function(next) {
    
    // Set viewedAt when status changes to viewed
    if (this.isModified('status') && this.status === 'viewed' && !this.viewedAt) {
        this.viewedAt = new Date();
    }
    
    // Set respondedAt when status changes from pending/viewed
    if (this.isModified('status') && 
        ['accepted', 'rejected', 'counter_offer'].includes(this.status) && 
        !this.respondedAt) {
        this.respondedAt = new Date();
    }
    
    next();
});

// Virtual to check if expired
exchangeRequestSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date() && ['pending', 'viewed'].includes(this.status);
});

// Virtual for request age in hours
exchangeRequestSchema.virtual('ageInHours').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to check if can be withdrawn
exchangeRequestSchema.methods.canBeWithdrawn = function(labId) {
    return this.requesterLab.toString() === labId.toString() && 
           ['pending', 'viewed'].includes(this.status);
};

// Method to check if can be responded to
exchangeRequestSchema.methods.canBeRespondedTo = function(labId) {
    const ownerLabId = this.targetProduct.ownerLab._id || this.targetProduct.ownerLab;
    const currentLabId = labId._id || labId;
    
    const isOwner = ownerLabId.toString() === currentLabId.toString();
    const validStatus = ['pending', 'viewed'].includes(this.status);
    const notExpired = !this.isExpired;
    

    
    return isOwner && validStatus && notExpired;
};

// Static method to cleanup expired requests
exchangeRequestSchema.statics.cleanupExpired = async function() {
    const result = await this.updateMany(
        {
            status: { $in: ['pending', 'viewed'] },
            expiresAt: { $lt: new Date() }
        },
        {
            status: 'expired'
        }
    );
    
    return result.modifiedCount;
};

// Static method to get request statistics for a lab
exchangeRequestSchema.statics.getLabStatistics = async function(labId, startDate, endDate) {
    const match = {
        $or: [
            { requesterLab: labId },
            { 'targetProduct.ownerLab': labId }
        ]
    };
    
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                sentRequests: {
                    $sum: {
                        $cond: [
                            { $eq: ['$requesterLab', labId] },
                            1,
                            0
                        ]
                    }
                },
                receivedRequests: {
                    $sum: {
                        $cond: [
                            { $eq: ['$targetProduct.ownerLab', labId] },
                            1,
                            0
                        ]
                    }
                },
                acceptedRequests: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'accepted'] },
                            1,
                            0
                        ]
                    }
                },
                pendingRequests: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['pending', 'viewed']] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalRequests: 0,
        sentRequests: 0,
        receivedRequests: 0,
        acceptedRequests: 0,
        pendingRequests: 0
    };
};

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
