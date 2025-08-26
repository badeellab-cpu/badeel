import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { categoriesAPI } from '../../config/api';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getAll(params);
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب الفئات');
    }
  }
);

export const fetchCategoryTree = createAsyncThunk(
  'categories/fetchCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getTree();
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب شجرة الفئات');
    }
  }
);

export const fetchFeaturedCategories = createAsyncThunk(
  'categories/fetchFeaturedCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoriesAPI.getFeatured();
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب الفئات المميزة');
    }
  }
);

// Initial state
const initialState = {
  categories: [],
  categoryTree: [],
  featuredCategories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Category Tree
    builder
      .addCase(fetchCategoryTree.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategoryTree.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryTree = action.payload;
      })
      .addCase(fetchCategoryTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Featured Categories
    builder
      .addCase(fetchFeaturedCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeaturedCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredCategories = action.payload;
      })
      .addCase(fetchFeaturedCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentCategory, clearCurrentCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;

// Selectors
export const selectCategories = (state) => state.categories.categories;
export const selectCategoryTree = (state) => state.categories.categoryTree;
export const selectFeaturedCategories = (state) => state.categories.featuredCategories;
export const selectCurrentCategory = (state) => state.categories.currentCategory;
export const selectCategoriesLoading = (state) => state.categories.loading;