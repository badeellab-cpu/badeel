const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: {
        ar: {
            type: String,
            required: [true, 'يرجى إدخال اسم الفئة بالعربية'],
            trim: true,
            maxlength: [100, 'اسم الفئة لا يمكن أن يتجاوز 100 حرف']
        },
        en: {
            type: String,
            required: [true, 'يرجى إدخال اسم الفئة بالإنجليزية'],
            trim: true,
            maxlength: [100, 'اسم الفئة لا يمكن أن يتجاوز 100 حرف']
        }
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        ar: {
            type: String,
            maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف']
        },
        en: {
            type: String,
            maxlength: [500, 'الوصف لا يمكن أن يتجاوز 500 حرف']
        }
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        type: String,
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    metadata: {
        productsCount: {
            type: Number,
            default: 0
        },
        viewsCount: {
            type: Number,
            default: 0
        }
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    attributes: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'number', 'select', 'multiselect', 'boolean', 'date'],
            default: 'text'
        },
        options: [String],
        required: {
            type: Boolean,
            default: false
        },
        unit: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ 'name.ar': 'text', 'name.en': 'text', 'description.ar': 'text', 'description.en': 'text' });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Virtual for products
categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category'
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (!this.slug || this.isModified('name')) {
        // Use Arabic name for slug generation
        this.slug = slugify(this.name.ar, {
            replacement: '-',
            lower: true,
            strict: true,
            locale: 'ar'
        });
    }
    next();
});

// Method to get all ancestors
categorySchema.methods.getAncestors = async function() {
    const ancestors = [];
    let parent = await this.model('Category').findById(this.parent);
    
    while (parent) {
        ancestors.unshift(parent);
        parent = await this.model('Category').findById(parent.parent);
    }
    
    return ancestors;
};

// Method to get all descendants
categorySchema.methods.getDescendants = async function() {
    const descendants = [];
    const children = await this.model('Category').find({ parent: this._id });
    
    for (const child of children) {
        descendants.push(child);
        const childDescendants = await child.getDescendants();
        descendants.push(...childDescendants);
    }
    
    return descendants;
};

// Static method to build category tree
categorySchema.statics.buildTree = async function() {
    const categories = await this.find({ isActive: true }).sort('order name');
    const categoryMap = {};
    const tree = [];
    
    // Create a map of categories
    categories.forEach(cat => {
        categoryMap[cat._id] = {
            ...cat.toObject(),
            children: []
        };
    });
    
    // Build the tree
    categories.forEach(cat => {
        if (cat.parent) {
            if (categoryMap[cat.parent]) {
                categoryMap[cat.parent].children.push(categoryMap[cat._id]);
            }
        } else {
            tree.push(categoryMap[cat._id]);
        }
    });
    
    return tree;
};

// Get descendants (subcategories)
categorySchema.methods.getDescendants = async function() {
    const descendants = [];
    
    const getChildren = async (categoryId) => {
        const children = await this.model('Category').find({ parent: categoryId });
        for (const child of children) {
            descendants.push(child);
            await getChildren(child._id);
        }
    };
    
    await getChildren(this._id);
    return descendants;
};

// Get ancestors (parent categories)
categorySchema.methods.getAncestors = async function() {
    const ancestors = [];
    let current = this;
    
    while (current.parent) {
        const parent = await this.model('Category').findById(current.parent);
        if (parent) {
            ancestors.unshift(parent);
            current = parent;
        } else {
            break;
        }
    }
    
    return ancestors;
};

// Update products count
categorySchema.statics.updateProductsCount = async function(categoryId) {
    const count = await mongoose.model('Product').countDocuments({
        category: categoryId,
        status: 'active'
    });
    
    await this.findByIdAndUpdate(categoryId, {
        'metadata.productsCount': count
    });
};

// Pre remove middleware to handle cascading
categorySchema.pre('remove', async function(next) {
    // Move all products to uncategorized or delete them
    await mongoose.model('Product').updateMany(
        { category: this._id },
        { $unset: { category: 1 } }
    );
    
    // Move all subcategories to parent or root
    await this.model('Category').updateMany(
        { parent: this._id },
        { parent: this.parent }
    );
    
    next();
});

module.exports = mongoose.model('Category', categorySchema);