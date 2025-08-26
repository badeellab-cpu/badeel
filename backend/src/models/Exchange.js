const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    exchangeNumber: {
        type: String,
        required: true,
        unique: true
    },
    requester: {
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
    receiver: {
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
    requesterProduct: {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    receiverProduct: {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    status: {
        type: String,
        enum: [
            'pending',      // في انتظار الموافقة
            'accepted',     // تم القبول
            'rejected',     // تم الرفض
            'negotiating',  // تحت التفاوض
            'confirmed',    // تم التأكيد من الطرفين
            'in_progress',  // جاري التنفيذ
            'completed',    // مكتمل
            'cancelled',    // ملغي
            'disputed'      // متنازع عليه
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
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true
        },
        attachments: [{
            filename: String,
            url: String
        }],
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: Date,
        sentAt: {
            type: Date,
            default: Date.now
        }
    }],
    negotiation: {
        isActive: {
            type: Boolean,
            default: false
        },
        proposals: [{
            proposedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            requesterQuantity: Number,
            receiverQuantity: Number,
            additionalTerms: String,
            proposedAt: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending'
            }
        }]
    },
    shipping: {
        method: {
            type: String,
            enum: ['direct_exchange', 'shipped_exchange', 'pickup'],
            default: 'direct_exchange'
        },
        // Estimated delivery date for shipments (top-level for easy access)
        estimatedDelivery: {
            type: Date
        },
        requesterShipping: {
            address: {
                street: String,
                city: String,
                district: String,
                postalCode: String
            },
            trackingNumber: String,
            carrier: String,
            estimatedDelivery: Date,
            shippedAt: Date,
            deliveredAt: Date
        },
        receiverShipping: {
            address: {
                street: String,
                city: String,
                district: String,
                postalCode: String
            },
            trackingNumber: String,
            carrier: String,
            estimatedDelivery: Date,
            shippedAt: Date,
            deliveredAt: Date
        }
    },
    meetingDetails: {
        location: String,
        date: Date,
        time: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: [Number]
        },
        confirmedByRequester: {
            type: Boolean,
            default: false
        },
        confirmedByReceiver: {
            type: Boolean,
            default: false
        }
    },
    rating: {
        requesterRating: {
            value: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            ratedAt: Date
        },
        receiverRating: {
            value: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            ratedAt: Date
        }
    },
    dispute: {
        isDisputed: {
            type: Boolean,
            default: false
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        evidence: [{
            type: String,
            description: String,
            url: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        openedAt: Date,
        resolvedAt: Date,
        resolution: String,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    notes: {
        requester: String,
        receiver: String,
        admin: String
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
    },
    completedAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
exchangeSchema.index({ exchangeNumber: 1 });
exchangeSchema.index({ 'requester.user': 1, createdAt: -1 });
exchangeSchema.index({ 'receiver.user': 1, createdAt: -1 });
exchangeSchema.index({ status: 1 });
exchangeSchema.index({ expiresAt: 1 });
exchangeSchema.index({ createdAt: -1 });

// Generate exchange number before saving
// Ensure exchangeNumber exists before validation to satisfy 'required: true'
exchangeSchema.pre('validate', async function(next) {
    if (!this.exchangeNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        this.exchangeNumber = `EXC-${year}${month}${day}-${random}`;
    }
    
    next();
});

// Keep status history updates on save
exchangeSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            updatedAt: new Date()
        });
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        }
    }
    next();
});

// Update product quantities after exchange status changes
exchangeSchema.post('save', async function(doc, next) {
    const Product = mongoose.model('Product');
    
    if (doc.status === 'completed' && this.modifiedPaths().includes('status')) {
        // فقط نحدث حالة المنتج دون تعديل المخزون لأن الخصم تم عند القبول
        await Product.findByIdAndUpdate(doc.requesterProduct.product, {
            status: 'exchanged',
            'metadata.lastExchangedAt': new Date()
        });
        
        await Product.findByIdAndUpdate(doc.receiverProduct.product, {
            status: 'exchanged',
            'metadata.lastExchangedAt': new Date()
        });
    }
    
    next();
});

// Virtual for exchange age in days
exchangeSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual to check if expired
exchangeSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date() && this.status === 'pending';
});

// Method to check if can be cancelled
exchangeSchema.methods.canBeCancelled = function(userId) {
    const nonCancellableStatuses = ['completed', 'cancelled'];
    if (nonCancellableStatuses.includes(this.status)) {
        return false;
    }
    
    // Only requester and receiver can cancel
    return this.requester.user.toString() === userId.toString() ||
           this.receiver.user.toString() === userId.toString();
};

// Method to add message
exchangeSchema.methods.addMessage = async function(senderId, message, attachments = []) {
    this.messages.push({
        sender: senderId,
        message,
        attachments,
        sentAt: new Date()
    });
    
    await this.save();
};

// Method to mark messages as read
exchangeSchema.methods.markMessagesAsRead = async function(userId) {
    let updated = false;
    
    this.messages.forEach(msg => {
        if (msg.sender.toString() !== userId.toString() && !msg.isRead) {
            msg.isRead = true;
            msg.readAt = new Date();
            updated = true;
        }
    });
    
    if (updated) {
        await this.save();
    }
};

// Static method to get exchange statistics for a lab
exchangeSchema.statics.getLabStatistics = async function(labId, startDate, endDate) {
    const match = {
        $or: [
            { 'requester.lab': labId },
            { 'receiver.lab': labId }
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
                totalExchanges: { $sum: 1 },
                completedExchanges: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'completed'] },
                            1,
                            0
                        ]
                    }
                },
                pendingExchanges: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'pending'] },
                            1,
                            0
                        ]
                    }
                },
                asRequester: {
                    $sum: {
                        $cond: [
                            { $eq: ['$requester.lab', labId] },
                            1,
                            0
                        ]
                    }
                },
                asReceiver: {
                    $sum: {
                        $cond: [
                            { $eq: ['$receiver.lab', labId] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalExchanges: 0,
        completedExchanges: 0,
        pendingExchanges: 0,
        asRequester: 0,
        asReceiver: 0
    };
};

// Static method to cleanup expired exchanges
exchangeSchema.statics.cleanupExpired = async function() {
    const result = await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() }
        },
        {
            status: 'cancelled',
            cancellationReason: 'انتهت صلاحية طلب التبادل'
        }
    );
    
    return result.modifiedCount;
};

module.exports = mongoose.model('Exchange', exchangeSchema);