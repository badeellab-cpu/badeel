const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    category: {
        type: String,
        enum: [
            'deposit',      // إيداع
            'withdrawal',   // سحب
            'purchase',     // شراء
            'sale',         // بيع
            'refund',       // استرداد
            'fee',          // رسوم
            'commission',   // عمولة
            'freeze',       // تجميد
            'unfreeze',     // إلغاء تجميد
            'adjustment',   // تعديل
            'bonus',        // مكافأة
            'penalty'       // غرامة
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'SAR',
        enum: ['SAR', 'USD', 'EUR']
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    frozenAmount: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true
    },
    reference: {
        type: String,
        index: true
    },
    relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    relatedExchange: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exchange'
    },
    status: {
        type: String,
        enum: [
            'pending',      // في الانتظار
            'processing',   // قيد المعالجة
            'completed',    // مكتمل
            'failed',       // فشل
            'cancelled',    // ملغي
            'frozen',       // مجمد
            'reversed'      // معكوس
        ],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'credit_card', 'bank_transfer', 'cash', 'system']
    },
    paymentDetails: {
        gateway: String,
        gatewayTransactionId: String,
        cardLast4: String,
        cardBrand: String,
        bankName: String,
        accountNumber: String,
        iban: String
    },
    fees: {
        platformFee: {
            type: Number,
            default: 0
        },
        paymentFee: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        totalFees: {
            type: Number,
            default: 0
        }
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceId: String,
        location: String,
        notes: String,
        bankAccount: {
            bankName: String,
            accountName: String,
            iban: String
        },
        exchangeRate: Number,
        originalAmount: Number,
        originalCurrency: String
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    failureReason: String,
    reversedTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    isReversed: {
        type: Boolean,
        default: false
    },
    notifications: [{
        type: {
            type: String,
            enum: ['email', 'sms', 'push']
        },
        sentAt: Date,
        status: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ lab: 1, createdAt: -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ relatedOrder: 1 });
transactionSchema.index({ relatedExchange: 1 });
transactionSchema.index({ createdAt: -1 });

// Generate transaction ID before saving
transactionSchema.pre('save', async function(next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TRX-${timestamp}-${random}`;
    }
    
    // Calculate balance before if not set
    if (this.isNew && this.balanceBefore === undefined) {
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findById(this.wallet);
        this.balanceBefore = wallet.balance;
    }
    
    // Calculate total fees
    if (this.fees) {
        this.fees.totalFees = 
            (this.fees.platformFee || 0) + 
            (this.fees.paymentFee || 0) + 
            (this.fees.tax || 0);
    }
    
    next();
});

// Update wallet statistics after transaction
transactionSchema.post('save', async function(doc) {
    if (doc.status === 'completed' && this.wasNew) {
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findById(doc.wallet);
        
        if (wallet) {
            const updateData = { 'statistics.lastTransactionAt': doc.createdAt };
            
            if (doc.type === 'credit') {
                if (doc.category === 'sale') {
                    updateData['statistics.totalEarned'] = wallet.statistics.totalEarned + doc.amount;
                } else if (doc.category === 'deposit') {
                    updateData['statistics.totalDeposited'] = wallet.statistics.totalDeposited + doc.amount;
                }
            } else if (doc.type === 'debit') {
                if (doc.category === 'withdrawal') {
                    updateData['statistics.totalWithdrawn'] = wallet.statistics.totalWithdrawn + doc.amount;
                } else if (doc.category === 'purchase') {
                    updateData['statistics.totalSpent'] = wallet.statistics.totalSpent + doc.amount;
                }
            }
            
            await Wallet.findByIdAndUpdate(doc.wallet, updateData);
        }
    }
});

// Virtual for net amount (after fees)
transactionSchema.virtual('netAmount').get(function() {
    if (this.type === 'credit') {
        return this.amount - (this.fees?.totalFees || 0);
    } else {
        return this.amount + (this.fees?.totalFees || 0);
    }
});

// Method to complete transaction
transactionSchema.methods.complete = async function() {
    if (this.status !== 'pending' && this.status !== 'processing') {
        throw new Error('المعاملة لا يمكن إكمالها في حالتها الحالية');
    }
    
    this.status = 'completed';
    this.processedAt = new Date();
    
    // Update wallet balance if not already done
    if (this.type === 'debit' && this.category === 'withdrawal') {
        const Wallet = mongoose.model('Wallet');
        const wallet = await Wallet.findById(this.wallet);
        
        if (wallet.frozenAmount >= this.amount) {
            wallet.frozenAmount -= this.amount;
            wallet.balance -= this.amount;
            await wallet.save();
        }
    }
    
    await this.save();
};

// Method to fail transaction
transactionSchema.methods.fail = async function(reason) {
    if (this.status !== 'pending' && this.status !== 'processing') {
        throw new Error('المعاملة لا يمكن إلغاؤها في حالتها الحالية');
    }
    
    this.status = 'failed';
    this.failureReason = reason;
    this.processedAt = new Date();
    
    // Unfreeze amount if it was frozen
    if (this.type === 'debit' && this.frozenAmount > 0) {
        const Wallet = mongoose.model('Wallet');
        await Wallet.findByIdAndUpdate(this.wallet, {
            $inc: { frozenAmount: -this.frozenAmount }
        });
    }
    
    await this.save();
};

// Method to reverse transaction
transactionSchema.methods.reverse = async function(reason, processedBy) {
    if (this.status !== 'completed') {
        throw new Error('يمكن عكس المعاملات المكتملة فقط');
    }
    
    if (this.isReversed) {
        throw new Error('المعاملة معكوسة بالفعل');
    }
    
    const Wallet = mongoose.model('Wallet');
    const wallet = await Wallet.findById(this.wallet);
    
    if (!wallet) {
        throw new Error('المحفظة غير موجودة');
    }
    
    // Create reverse transaction
    const reverseTransaction = await this.model('Transaction').create({
        wallet: this.wallet,
        lab: this.lab,
        type: this.type === 'credit' ? 'debit' : 'credit',
        category: 'refund',
        amount: this.amount,
        balanceBefore: wallet.balance,
        balanceAfter: this.type === 'credit' ? 
            wallet.balance - this.amount : 
            wallet.balance + this.amount,
        description: `عكس المعاملة: ${this.description} - السبب: ${reason}`,
        reference: `REV-${this.transactionId}`,
        reversedTransaction: this._id,
        status: 'completed',
        processedBy: processedBy,
        processedAt: new Date()
    });
    
    // Update wallet balance
    if (this.type === 'credit') {
        wallet.balance -= this.amount;
    } else {
        wallet.balance += this.amount;
    }
    
    wallet.transactions.push(reverseTransaction._id);
    await wallet.save();
    
    // Mark original transaction as reversed
    this.isReversed = true;
    await this.save();
    
    return reverseTransaction;
};

// Static method to get transaction summary
transactionSchema.statics.getSummary = async function(labId, period = 'month') {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    
    const summary = await this.aggregate([
        {
            $match: {
                lab: labId,
                status: 'completed',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    category: '$category'
                },
                count: { $sum: 1 },
                total: { $sum: '$amount' },
                fees: { $sum: '$fees.totalFees' }
            }
        },
        {
            $group: {
                _id: '$_id.type',
                categories: {
                    $push: {
                        category: '$_id.category',
                        count: '$count',
                        total: '$total',
                        fees: '$fees'
                    }
                },
                totalCount: { $sum: '$count' },
                totalAmount: { $sum: '$total' },
                totalFees: { $sum: '$fees' }
            }
        }
    ]);
    
    return {
        period,
        startDate,
        endDate: now,
        summary
    };
};

module.exports = mongoose.model('Transaction', transactionSchema);