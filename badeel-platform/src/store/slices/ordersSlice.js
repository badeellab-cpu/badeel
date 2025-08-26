import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersAPI } from '../../config/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب الطلبات');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getMyOrders(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب طلباتك');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getById(id);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب الطلب');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.create(orderData);
      toast.success('تم إنشاء الطلب بنجاح');
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل إنشاء الطلب');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status, data }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.updateStatus(id, status, data);
      toast.success('تم تحديث حالة الطلب بنجاح');
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تحديث حالة الطلب');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.cancel(id, reason);
      toast.success('تم إلغاء الطلب بنجاح');
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل إلغاء الطلب');
    }
  }
);

// Initial state
const initialState = {
  orders: [],
  myOrders: [],
  currentOrder: null,
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
const ordersSlice = createSlice({
  name: 'orders',
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
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch My Orders
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Order By Id
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.unshift(action.payload);
        state.myOrders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Order Status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updateOrder = (orders) => {
          const index = orders.findIndex(o => o._id === action.payload._id);
          if (index !== -1) {
            orders[index] = action.payload;
          }
        };
        updateOrder(state.orders);
        updateOrder(state.myOrders);
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updateOrder = (orders) => {
          const index = orders.findIndex(o => o._id === action.payload._id);
          if (index !== -1) {
            orders[index] = action.payload;
          }
        };
        updateOrder(state.orders);
        updateOrder(state.myOrders);
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  clearCurrentOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectMyOrders = (state) => state.orders.myOrders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersPagination = (state) => state.orders.pagination;
export const selectOrdersFilters = (state) => state.orders.filters;
export const selectOrdersLoading = (state) => state.orders.loading;