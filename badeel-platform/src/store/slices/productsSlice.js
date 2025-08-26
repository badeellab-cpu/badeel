import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../config/api';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المنتجات');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getById(id);
      return response.data.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المنتج');
    }
  }
);

export const fetchTrendingProducts = createAsyncThunk(
  'products/fetchTrendingProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getTrending();
      return response.data.data.products;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المنتجات الرائجة');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productsAPI.create(productData);
      return response.data.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل إنشاء المنتج');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.update(id, data);
      return response.data.data.product;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تحديث المنتج');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productsAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل حذف المنتج');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'products/toggleFavorite',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productsAPI.toggleFavorite(productId);
      return { productId, isFavorite: response.data.data.isFavorite };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تحديث المفضلة');
    }
  }
);

// Initial state
const initialState = {
  products: [],
  trendingProducts: [],
  currentProduct: null,
  favorites: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  },
  filters: {
    category: null,
    type: null,
    condition: null,
    minPrice: null,
    maxPrice: null,
    search: '',
    sort: 'createdAt',
    order: 'desc',
  },
  loading: false,
  error: null,
};

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    addToFavorites: (state, action) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Product By Id
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Trending Products
    builder
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingProducts = action.payload;
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Product
    builder
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct?._id === action.payload._id) {
          state.currentProduct = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Product
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p._id !== action.payload);
      });

    // Toggle Favorite
    builder
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload;
        if (isFavorite) {
          state.favorites.push(productId);
        } else {
          state.favorites = state.favorites.filter(id => id !== productId);
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  clearCurrentProduct,
  addToFavorites,
  removeFromFavorites,
} = productsSlice.actions;

export default productsSlice.reducer;

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectTrendingProducts = (state) => state.products.trendingProducts;
export const selectCurrentProduct = (state) => state.products.currentProduct;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductsFilters = (state) => state.products.filters;
export const selectProductsLoading = (state) => state.products.loading;
export const selectFavorites = (state) => state.products.favorites;
export const selectIsFavorite = (productId) => (state) => 
  state.products.favorites.includes(productId);