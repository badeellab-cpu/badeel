import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { walletsAPI } from '../../config/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchMyWallet = createAsyncThunk(
  'wallet/fetchMyWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletsAPI.getMyWallet();
      return response.data.data.wallet;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المحفظة');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await walletsAPI.getTransactions(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب المعاملات');
    }
  }
);

export const transferFunds = createAsyncThunk(
  'wallet/transferFunds',
  async (transferData, { rejectWithValue }) => {
    try {
      const response = await walletsAPI.transfer(transferData);
      toast.success('تم التحويل بنجاح');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل التحويل');
    }
  }
);

// Initial state
const initialState = {
  wallet: null,
  transactions: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  },
  filters: {
    type: null,
    dateFrom: null,
    dateTo: null,
  },
  loading: false,
  error: null,
};

// Slice
const walletSlice = createSlice({
  name: 'wallet',
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
    updateBalance: (state, action) => {
      if (state.wallet) {
        state.wallet.balance = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch My Wallet
    builder
      .addCase(fetchMyWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchMyWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Transfer Funds
    builder
      .addCase(transferFunds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(transferFunds.fulfilled, (state, action) => {
        state.loading = false;
        // Update wallet balance
        if (state.wallet && action.payload.senderWallet) {
          state.wallet.balance = action.payload.senderWallet.balance;
        }
        // Add transaction to list
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
        }
      })
      .addCase(transferFunds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setPage,
  updateBalance,
} = walletSlice.actions;

export default walletSlice.reducer;

// Selectors
export const selectWallet = (state) => state.wallet.wallet;
export const selectWalletBalance = (state) => state.wallet.wallet?.balance || 0;
export const selectTransactions = (state) => state.wallet.transactions;
export const selectTransactionsPagination = (state) => state.wallet.pagination;
export const selectWalletFilters = (state) => state.wallet.filters;
export const selectWalletLoading = (state) => state.wallet.loading;