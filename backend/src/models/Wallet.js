const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'SAR',
        enum: ['SAR', 'USD', 'EUR']
    },
    status: {
        type: String,
        enum: ['active', 'frozen', 'suspended'],
        default: 'active'
    },
    frozenAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    bankAccounts: [{
        bankName: {
            type: String,
            required: true
        },
        accountName: {
            type: String,
            required: true
        },
        iban: {
            type: String,
            required: true,
            match: [/^SA\d{22}$/, 'IBAN غير صحيح']
        },
        accountNumber: String,
        isDefault: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedAt: Date,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    withdrawalSettings: {
        autoWithdrawal: {
            type: Boolean,
            default: false
        },
        autoWithdrawalThreshold: {
            type: Number,
            default: 1000
        },
        preferredBankAccount: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    limits: {
        dailyWithdrawal: {
            type: Number,
            default: 50000
        },
        monthlyWithdrawal: {
            type: Number,
            default: 500000
        },
        minimumWithdrawal: {
            type: Number,
            default: 100
        },
        maximumBalance: {
            type: Number,
            default: 1000000
        }
    },
    statistics: {
        totalDeposited: {
            type: Number,
            default: 0
        },
        totalWithdrawn: {
            type: Number,
            default: 0
        },
        totalEarned: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        lastTransactionAt: Date
    },
    notifications: {
        lowBalance: {
            enabled: {
                type: Boolean,
                default: true
            },
            threshold: {
                type: Number,
                default: 100
            }
        },
        largeTransaction: {
            enabled: {
                type: Boolean,
                default: true
            },
            threshold: {
                type: Number,
                default: 10000
            }
        }
    },
    metadata: {
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
walletSchema.index({ lab: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ balance: 1 });

// Virtual for available balance
walletSchema.virtual('availableBalance').get(function() {
    return this.balance - this.frozenAmount;
});

// Pre save middleware to ensure only one default bank account
walletSchema.pre('save', function(next) {
    if (this.isModified('bankAccounts')) {
        const defaultAccounts = this.bankAccounts.filter(acc => acc.isDefault);
        if (defaultAccounts.length > 1) {
            // Keep only the last one as default
            this.bankAccounts.forEach((acc, index) => {
                acc.isDefault = index === this.bankAccounts.length - 1;
            });
        }
        
        // Sanitize IBANs
        this.bankAccounts.forEach(acc => {
            if (acc.iban) {
                acc.iban = acc.iban.replace(/\s/g, '').toUpperCase();
            }
        });
    }
    
    next();
});

// Method to add funds
walletSchema.methods.addFunds = async function(amount, description, reference) {
    if (amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    if (this.status !== 'active') {
        throw new Error('المحفظة غير نشطة');
    }
    
    this.balance += amount;
    this.statistics.totalDeposited += amount;
    this.statistics.lastTransactionAt = new Date();
    
    // Create transaction record
    const Transaction = mongoose.model('Transaction');
    const transaction = await Transaction.create({
        wallet: this._id,
        lab: this.lab,
        type: 'credit',
        category: 'deposit',
        amount: amount,
        balanceAfter: this.balance,
        description: description,
        reference: reference,
        status: 'completed'
    });
    
    this.transactions.push(transaction._id);
    await this.save();
    
    return transaction;
};

// Method to deduct funds
walletSchema.methods.deductFunds = async function(amount, description, reference, freeze = false) {
    if (amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    if (this.status !== 'active') {
        throw new Error('المحفظة غير نشطة');
    }
    
    if (freeze) {
        if (this.availableBalance < amount) {
            throw new Error('الرصيد المتاح غير كافي');
        }
        this.frozenAmount += amount;
    } else {
        if (this.balance < amount) {
            throw new Error('الرصيد غير كافي');
        }
        this.balance -= amount;
        this.statistics.totalSpent += amount;
    }
    
    this.statistics.lastTransactionAt = new Date();
    
    // Create transaction record
    const Transaction = mongoose.model('Transaction');
    const transaction = await Transaction.create({
        wallet: this._id,
        lab: this.lab,
        type: 'debit',
        category: freeze ? 'freeze' : 'purchase',
        amount: amount,
        balanceAfter: this.balance,
        frozenAmount: freeze ? amount : 0,
        description: description,
        reference: reference,
        status: freeze ? 'frozen' : 'completed'
    });
    
    this.transactions.push(transaction._id);
    await this.save();
    
    return transaction;
};

// Method to unfreeze funds
walletSchema.methods.unfreezeFunds = async function(amount, deduct = false, description, reference) {
    if (amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    if (this.frozenAmount < amount) {
        throw new Error('المبلغ المجمد غير كافي');
    }
    
    this.frozenAmount -= amount;
    
    if (deduct) {
        this.balance -= amount;
        this.statistics.totalSpent += amount;
    }
    
    this.statistics.lastTransactionAt = new Date();
    
    // Create transaction record
    const Transaction = mongoose.model('Transaction');
    const transaction = await Transaction.create({
        wallet: this._id,
        lab: this.lab,
        type: deduct ? 'debit' : 'credit',
        category: 'unfreeze',
        amount: amount,
        balanceAfter: this.balance,
        description: description,
        reference: reference,
        status: 'completed'
    });
    
    this.transactions.push(transaction._id);
    await this.save();
    
    return transaction;
};

// Method to process withdrawal
walletSchema.methods.withdraw = async function(amount, bankAccountId, description) {
    if (amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }
    
    if (this.status !== 'active') {
        throw new Error('المحفظة غير نشطة');
    }
    
    if (this.availableBalance < amount) {
        throw new Error('الرصيد المتاح غير كافي');
    }
    
    if (amount < this.limits.minimumWithdrawal) {
        throw new Error(`الحد الأدنى للسحب هو ${this.limits.minimumWithdrawal} ريال`);
    }
    
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const Transaction = mongoose.model('Transaction');
    const todayWithdrawals = await Transaction.aggregate([
        {
            $match: {
                wallet: this._id,
                type: 'debit',
                category: 'withdrawal',
                createdAt: { $gte: today }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);
    
    const todayTotal = todayWithdrawals[0]?.total || 0;
    if (todayTotal + amount > this.limits.dailyWithdrawal) {
        throw new Error(`تجاوزت الحد اليومي للسحب (${this.limits.dailyWithdrawal} ريال)`);
    }
    
    // Find bank account
    const bankAccount = this.bankAccounts.id(bankAccountId);
    if (!bankAccount) {
        throw new Error('الحساب البنكي غير موجود');
    }
    
    if (!bankAccount.isVerified) {
        throw new Error('الحساب البنكي غير مُحقق');
    }
    
    // Freeze the amount first
    this.frozenAmount += amount;
    
    // Create withdrawal transaction
    const transaction = await Transaction.create({
        wallet: this._id,
        lab: this.lab,
        type: 'debit',
        category: 'withdrawal',
        amount: amount,
        balanceAfter: this.balance - amount,
        description: description || 'سحب إلى الحساب البنكي',
        reference: `WD-${Date.now()}`,
        status: 'pending',
        metadata: {
            bankAccount: {
                bankName: bankAccount.bankName,
                accountName: bankAccount.accountName,
                iban: bankAccount.iban
            }
        }
    });
    
    this.transactions.push(transaction._id);
    await this.save();
    
    return transaction;
};

// Method to get transaction history
walletSchema.methods.getTransactionHistory = async function(filters = {}) {
    const Transaction = mongoose.model('Transaction');
    
    const query = { wallet: this._id };
    
    if (filters.type) {
        query.type = filters.type;
    }
    
    if (filters.category) {
        query.category = filters.category;
    }
    
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.startDate && filters.endDate) {
        query.createdAt = {
            $gte: filters.startDate,
            $lte: filters.endDate
        };
    }
    
    const transactions = await Transaction.find(query)
        .sort('-createdAt')
        .limit(filters.limit || 50)
        .skip(filters.skip || 0);
    
    return transactions;
};

// Static method to create wallet for new lab
walletSchema.statics.createForLab = async function(labId) {
    const existingWallet = await this.findOne({ lab: labId });
    if (existingWallet) {
        return existingWallet;
    }
    
    return this.create({ lab: labId });
};

module.exports = mongoose.model('Wallet', walletSchema);