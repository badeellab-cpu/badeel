import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { labsAPI } from '../../config/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchLabs = createAsyncThunk(
  'labs/fetchLabs',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await labsAPI.getAll(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المختبرات');
    }
  }
);

export const fetchLabById = createAsyncThunk(
  'labs/fetchLabById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await labsAPI.getById(id);
      return response.data.data.lab;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المختبر');
    }
  }
);

export const fetchPendingLabs = createAsyncThunk(
  'labs/fetchPendingLabs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await labsAPI.getPending();
      return response.data.data.labs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المختبرات المعلقة');
    }
  }
);

export const approveLab = createAsyncThunk(
  'labs/approveLab',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await labsAPI.approve(id, data);
      toast.success('تم اعتماد المختبر بنجاح');
      return response.data.data.lab;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل اعتماد المختبر');
    }
  }
);

export const rejectLab = createAsyncThunk(
  'labs/rejectLab',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await labsAPI.reject(id, data);
      toast.success('تم رفض المختبر');
      return response.data.data.lab;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل رفض المختبر');
    }
  }
);

export const suspendLab = createAsyncThunk(
  'labs/suspendLab',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await labsAPI.suspend(id, data);
      toast.success('تم تعليق المختبر');
      return response.data.data.lab;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تعليق المختبر');
    }
  }
);

export const activateLab = createAsyncThunk(
  'labs/activateLab',
  async (id, { rejectWithValue }) => {
    try {
      const response = await labsAPI.activate(id);
      toast.success('تم تفعيل المختبر');
      return response.data.data.lab;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تفعيل المختبر');
    }
  }
);

export const fetchMyDashboard = createAsyncThunk(
  'labs/fetchMyDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await labsAPI.getMyDashboard();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب لوحة التحكم');
    }
  }
);

// Initial state
const initialState = {
  labs: [],
  pendingLabs: [],
  currentLab: null,
  myDashboard: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  },
  filters: {
    status: null,
    city: null,
    specialization: null,
    search: '',
  },
  loading: false,
  error: null,
};

// Slice
const labsSlice = createSlice({
  name: 'labs',
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
    clearCurrentLab: (state) => {
      state.currentLab = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Labs
    builder
      .addCase(fetchLabs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabs.fulfilled, (state, action) => {
        state.loading = false;
        state.labs = action.payload.labs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Lab By Id
    builder
      .addCase(fetchLabById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLab = action.payload;
      })
      .addCase(fetchLabById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Pending Labs
    builder
      .addCase(fetchPendingLabs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingLabs.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingLabs = action.payload;
      })
      .addCase(fetchPendingLabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Approve Lab
    builder
      .addCase(approveLab.fulfilled, (state, action) => {
        state.pendingLabs = state.pendingLabs.filter(lab => lab._id !== action.payload._id);
        const index = state.labs.findIndex(lab => lab._id === action.payload._id);
        if (index !== -1) {
          state.labs[index] = action.payload;
        }
      });

    // Reject Lab
    builder
      .addCase(rejectLab.fulfilled, (state, action) => {
        state.pendingLabs = state.pendingLabs.filter(lab => lab._id !== action.payload._id);
        state.labs = state.labs.filter(lab => lab._id !== action.payload._id);
      });

    // Suspend Lab
    builder
      .addCase(suspendLab.fulfilled, (state, action) => {
        const index = state.labs.findIndex(lab => lab._id === action.payload._id);
        if (index !== -1) {
          state.labs[index] = action.payload;
        }
        if (state.currentLab?._id === action.payload._id) {
          state.currentLab = action.payload;
        }
      });

    // Activate Lab
    builder
      .addCase(activateLab.fulfilled, (state, action) => {
        const index = state.labs.findIndex(lab => lab._id === action.payload._id);
        if (index !== -1) {
          state.labs[index] = action.payload;
        }
        if (state.currentLab?._id === action.payload._id) {
          state.currentLab = action.payload;
        }
      });

    // Fetch My Dashboard
    builder
      .addCase(fetchMyDashboard.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.myDashboard = action.payload;
      })
      .addCase(fetchMyDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  clearCurrentLab,
} = labsSlice.actions;

export default labsSlice.reducer;

// Selectors
export const selectLabs = (state) => state.labs.labs;
export const selectPendingLabs = (state) => state.labs.pendingLabs;
export const selectCurrentLab = (state) => state.labs.currentLab;
export const selectMyDashboard = (state) => state.labs.myDashboard;
export const selectLabsPagination = (state) => state.labs.pagination;
export const selectLabsFilters = (state) => state.labs.filters;
export const selectLabsLoading = (state) => state.labs.loading;