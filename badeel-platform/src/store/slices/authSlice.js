import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../config/api';
import toast from 'react-hot-toast';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user, lab } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (lab) {
        localStorage.setItem('lab', JSON.stringify(lab));
      }
      
      toast.success('تم تسجيل الدخول بنجاح');
      return { token, user, lab };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل تسجيل الدخول');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      toast.success('تم التسجيل بنجاح! يرجى انتظار موافقة الإدارة');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل التسجيل');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lab');
      toast.success('تم تسجيل الخروج بنجاح');
      return null;
    } catch (error) {
      // Clear local storage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lab');
      return null;
    }
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      const { user, lab } = response.data.data;
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(user));
      if (lab) {
        localStorage.setItem('lab', JSON.stringify(lab));
      }
      
      return { user, lab };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب بيانات المستخدم');
    }
  }
);

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  lab: JSON.parse(localStorage.getItem('lab')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.lab = action.payload.lab;
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.lab = action.payload.lab;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.lab = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
    
    // Get Me
    builder
      .addCase(getMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.lab = action.payload.lab;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        // If getMe fails, user might be logged out
        state.user = null;
        state.lab = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser, updateProfile } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectLab = (state) => state.auth.lab;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsLab = (state) => state.auth.user?.role === 'lab';