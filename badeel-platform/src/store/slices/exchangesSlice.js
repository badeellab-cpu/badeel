import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exchangesAPI } from '../../config/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchExchanges = createAsyncThunk(
  'exchanges/fetchExchanges',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب طلبات التبادل');
    }
  }
);

export const fetchMyRequests = createAsyncThunk(
  'exchanges/fetchMyRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.getMyRequests(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب طلبات التبادل الخاصة بك');
    }
  }
);

export const fetchOnMyProducts = createAsyncThunk(
  'exchanges/fetchOnMyProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.getOnMyProducts(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب طلبات التبادل على منتجاتك');
    }
  }
);

export const createExchange = createAsyncThunk(
  'exchanges/createExchange',
  async (exchangeData, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.create(exchangeData);
      toast.success('تم إرسال طلب التبادل بنجاح');
      return response.data.data.exchange;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل إنشاء طلب التبادل');
    }
  }
);

export const respondToExchange = createAsyncThunk(
  'exchanges/respondToExchange',
  async ({ id, response: responseData }, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.respond(id, responseData);
      toast.success('تم الرد على طلب التبادل بنجاح');
      return response.data.data.exchange;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل الرد على طلب التبادل');
    }
  }
);

export const updateExchangeStatus = createAsyncThunk(
  'exchanges/updateExchangeStatus',
  async ({ id, status, data }, { rejectWithValue }) => {
    try {
      const response = await exchangesAPI.updateStatus(id, status, data);
      toast.success('تم تحديث حالة طلب التبادل بنجاح');
      return response.data.data.exchange;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تحديث حالة طلب التبادل');
    }
  }
);

// Initial state
const initialState = {
  exchanges: [],
  myRequests: [],
  onMyProducts: [],
  currentExchange: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
  filters: {
    status: null,
    dateFrom: null,
    dateTo: null,
  },
  loading: false,
  error: null,
};

// Slice
const exchangesSlice = createSlice({
  name: 'exchanges',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setCurrentExchange: (state, action) => {
      state.currentExchange = action.payload;
    },
    clearCurrentExchange: (state) => {
      state.currentExchange = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Exchanges
    builder
      .addCase(fetchExchanges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchanges.fulfilled, (state, action) => {
        state.loading = false;
        state.exchanges = action.payload.exchanges;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchExchanges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch My Requests
    builder
      .addCase(fetchMyRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.myRequests = action.payload.exchanges;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch On My Products
    builder
      .addCase(fetchOnMyProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnMyProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.onMyProducts = action.payload.exchanges;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOnMyProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Exchange
    builder
      .addCase(createExchange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExchange.fulfilled, (state, action) => {
        state.loading = false;
        state.exchanges.unshift(action.payload);
        state.myRequests.unshift(action.payload);
      })
      .addCase(createExchange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Respond to Exchange
    builder
      .addCase(respondToExchange.pending, (state) => {
        state.loading = true;
      })
      .addCase(respondToExchange.fulfilled, (state, action) => {
        state.loading = false;
        const updateExchange = (exchanges) => {
          const index = exchanges.findIndex(e => e._id === action.payload._id);
          if (index !== -1) {
            exchanges[index] = action.payload;
          }
        };
        updateExchange(state.exchanges);
        updateExchange(state.myRequests);
        updateExchange(state.onMyProducts);
        if (state.currentExchange?._id === action.payload._id) {
          state.currentExchange = action.payload;
        }
      })
      .addCase(respondToExchange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Exchange Status
    builder
      .addCase(updateExchangeStatus.fulfilled, (state, action) => {
        const updateExchange = (exchanges) => {
          const index = exchanges.findIndex(e => e._id === action.payload._id);
          if (index !== -1) {
            exchanges[index] = action.payload;
          }
        };
        updateExchange(state.exchanges);
        updateExchange(state.myRequests);
        updateExchange(state.onMyProducts);
        if (state.currentExchange?._id === action.payload._id) {
          state.currentExchange = action.payload;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  setCurrentExchange,
  clearCurrentExchange,
} = exchangesSlice.actions;

export default exchangesSlice.reducer;

// Selectors
export const selectExchanges = (state) => state.exchanges.exchanges;
export const selectMyRequests = (state) => state.exchanges.myRequests;
export const selectOnMyProducts = (state) => state.exchanges.onMyProducts;
export const selectCurrentExchange = (state) => state.exchanges.currentExchange;
export const selectExchangesPagination = (state) => state.exchanges.pagination;
export const selectExchangesFilters = (state) => state.exchanges.filters;
export const selectExchangesLoading = (state) => state.exchanges.loading;