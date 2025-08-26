const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Lab = require('../models/Lab');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { buildPagination, calculatePaginationMeta } = require('../utils/helpers');

// @desc    Advanced search
// @route   GET /api/v1/search
// @access  Public
exports.advancedSearch = asyncHandler(async (req, res) => {
    const {
        q, // General search query
        category,
        type,
        condition,
        minPrice,
        maxPrice,
        brand,
        model,
        location,
        lab,
        tags,
        specifications,
        sortBy = 'relevance',
        sortOrder = 'desc',
        page = 1,
        limit = 12,
        includeInactive = false
    } = req.query;

    // Build the search pipeline
    let pipeline = [];

    // Initial match stage
    let matchStage = {
        approvalStatus: 'approved'
    };

    // Only include active products unless admin
    if (!includeInactive || req.user?.role !== 'admin') {
        matchStage.status = 'active';
    }

    // Text search
    if (q) {
        matchStage.$text = { $search: q };
    }

    // Category filter
    if (category) {
        const categoryObj = await Category.findById(category);
        if (categoryObj) {
            const descendants = await categoryObj.getDescendants();
            const categoryIds = [category, ...descendants.map(d => d._id)];
            matchStage.category = { $in: categoryIds };
        }
    }

    // Type filter
    if (type) {
        matchStage.type = type;
    }

    // Condition filter
    if (condition) {
        if (Array.isArray(condition)) {
            matchStage.condition = { $in: condition };
        } else {
            matchStage.condition = condition;
        }
    }

    // Price range filter
    if (minPrice || maxPrice) {
        matchStage.price = {};
        if (minPrice) matchStage.price.$gte = parseFloat(minPrice);
        if (maxPrice) matchStage.price.$lte = parseFloat(maxPrice);
    }

    // Brand filter
    if (brand) {
        if (Array.isArray(brand)) {
            matchStage.brand = { $in: brand };
        } else {
            matchStage.brand = { $regex: brand, $options: 'i' };
        }
    }

    // Model filter
    if (model) {
        matchStage.model = { $regex: model, $options: 'i' };
    }

    // Lab filter
    if (lab) {
        matchStage.lab = lab;
    }

    // Location filter
    if (location) {
        // First find labs in the specified location
        const labsInLocation = await Lab.find({
            $or: [
                { 'address.city': { $regex: location, $options: 'i' } },
                { 'address.region': { $regex: location, $options: 'i' } }
            ]
        }).distinct('_id');
        
        if (labsInLocation.length > 0) {
            matchStage.lab = { $in: labsInLocation };
        } else {
            // No labs found in location, return empty results
            return sendSuccess(res, 'لم يتم العثور على منتجات في هذا الموقع', {
                products: [],
                pagination: { total: 0, page: 1, limit: parseInt(limit), totalPages: 0 },
                facets: {}
            });
        }
    }

    // Tags filter
    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        matchStage.tags = { $in: tagArray };
    }

    // Specifications filter
    if (specifications) {
        try {
            const specsFilter = JSON.parse(specifications);
            Object.keys(specsFilter).forEach(key => {
                matchStage[`specifications.${key}`] = specsFilter[key];
            });
        } catch (error) {
            // Invalid JSON, ignore specifications filter
        }
    }

    // Add match stage
    pipeline.push({ $match: matchStage });

    // Add text score for relevance sorting
    if (q) {
        pipeline.push({
            $addFields: {
                score: { $meta: 'textScore' }
            }
        });
    }

    // Lookup stages for population
    pipeline.push(
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category'
            }
        },
        {
            $lookup: {
                from: 'labs',
                localField: 'lab',
                foreignField: '_id',
                as: 'lab'
            }
        },
        {
            $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
        },
        {
            $unwind: { path: '$lab', preserveNullAndEmptyArrays: true }
        }
    );

    // Build sort stage
    let sortStage = {};
    switch (sortBy) {
        case 'relevance':
            if (q) {
                sortStage = { score: { $meta: 'textScore' }, views: -1, createdAt: -1 };
            } else {
                sortStage = { views: -1, favorites: -1, createdAt: -1 };
            }
            break;
        case 'price':
            sortStage.price = sortOrder === 'desc' ? -1 : 1;
            break;
        case 'rating':
            sortStage['rating.average'] = sortOrder === 'desc' ? -1 : 1;
            break;
        case 'newest':
            sortStage.createdAt = -1;
            break;
        case 'oldest':
            sortStage.createdAt = 1;
            break;
        case 'popular':
            sortStage = { views: -1, favorites: -1 };
            break;
        case 'name':
            sortStage.name = sortOrder === 'desc' ? -1 : 1;
            break;
        default:
            sortStage.createdAt = -1;
    }

    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Product.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    const { skip, limit: limitNum } = buildPagination(page, limit);
    pipeline.push({ $skip: skip }, { $limit: limitNum });

    // Project only needed fields
    pipeline.push({
        $project: {
            name: 1,
            slug: 1,
            price: 1,
            type: 1,
            condition: 1,
            images: 1,
            rating: 1,
            views: 1,
            favorites: 1,
            createdAt: 1,
            brand: 1,
            model: 1,
            'category.name': 1,
            'category.slug': 1,
            'lab.labName': 1,
            'lab.address.city': 1,
            score: 1
        }
    });

    // Execute search
    const products = await Product.aggregate(pipeline);

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(total, parseInt(page), limitNum);

    // Get search facets for filtering
    const facets = await getSearchFacets(matchStage);

    sendSuccess(res, 'تم البحث بنجاح', {
        products,
        pagination,
        facets,
        searchQuery: {
            q,
            category,
            type,
            condition,
            priceRange: { min: minPrice, max: maxPrice },
            brand,
            model,
            location,
            lab,
            tags,
            sortBy,
            sortOrder
        }
    });
});

// @desc    Get search suggestions
// @route   GET /api/v1/search/suggestions
// @access  Public
exports.getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
        return sendSuccess(res, 'تم جلب الاقتراحات', { suggestions: [] });
    }

    // Get product name suggestions
    const productSuggestions = await Product.aggregate([
        {
            $match: {
                status: 'active',
                approvalStatus: 'approved',
                name: { $regex: q, $options: 'i' }
            }
        },
        {
            $project: {
                name: 1,
                type: 'product'
            }
        },
        { $limit: parseInt(limit) / 2 }
    ]);

    // Get category suggestions
    const categorySuggestions = await Category.aggregate([
        {
            $match: {
                isActive: true,
                name: { $regex: q, $options: 'i' }
            }
        },
        {
            $project: {
                name: 1,
                type: 'category'
            }
        },
        { $limit: parseInt(limit) / 2 }
    ]);

    // Get brand suggestions
    const brandSuggestions = await Product.aggregate([
        {
            $match: {
                status: 'active',
                approvalStatus: 'approved',
                brand: { $regex: q, $options: 'i' }
            }
        },
        {
            $group: {
                _id: '$brand',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                name: '$_id',
                type: 'brand',
                count: 1
            }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) / 4 }
    ]);

    const suggestions = [
        ...productSuggestions,
        ...categorySuggestions,
        ...brandSuggestions
    ].slice(0, parseInt(limit));

    sendSuccess(res, 'تم جلب الاقتراحات بنجاح', { suggestions });
});

// @desc    Get popular searches
// @route   GET /api/v1/search/popular
// @access  Public
exports.getPopularSearches = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // This would typically come from a search analytics system
    // For now, we'll return most viewed products and categories
    const [popularProducts, popularCategories] = await Promise.all([
        Product.find({ status: 'active', approvalStatus: 'approved' })
            .sort('-views')
            .limit(parseInt(limit) / 2)
            .select('name views'),
        Category.find({ isActive: true })
            .sort('-metadata.viewsCount')
            .limit(parseInt(limit) / 2)
            .select('name metadata.viewsCount')
    ]);

    const popularSearches = [
        ...popularProducts.map(p => ({ term: p.name, type: 'product', count: p.views })),
        ...popularCategories.map(c => ({ term: c.name, type: 'category', count: c.metadata.viewsCount || 0 }))
    ]
    .sort((a, b) => b.count - a.count)
    .slice(0, parseInt(limit));

    sendSuccess(res, 'تم جلب البحثات الشائعة بنجاح', { popularSearches });
});

// Helper function to get search facets
const getSearchFacets = async (baseMatch) => {
    const facetPipeline = [
        { $match: baseMatch },
        {
            $facet: {
                types: [
                    { $group: { _id: '$type', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                conditions: [
                    { $group: { _id: '$condition', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                brands: [
                    { $match: { brand: { $exists: true, $ne: null } } },
                    { $group: { _id: '$brand', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 20 }
                ],
                priceRanges: [
                    {
                        $bucket: {
                            groupBy: '$price',
                            boundaries: [0, 100, 500, 1000, 5000, 10000, 50000],
                            default: 'other',
                            output: { count: { $sum: 1 } }
                        }
                    }
                ],
                categories: [
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'categoryInfo'
                        }
                    },
                    { $unwind: '$categoryInfo' },
                    { $group: { _id: '$categoryInfo._id', name: { $first: '$categoryInfo.name' }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 15 }
                ]
            }
        }
    ];

    const facetResults = await Product.aggregate(facetPipeline);
    return facetResults[0] || {};
};