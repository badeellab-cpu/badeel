import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon as SearchIcon, 
  XMarkIcon as XIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { setSearchModalOpen } from '../../store/slices/uiSlice';
import { searchAPI } from '../../config/api';

const SearchModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector(state => state.ui.searchModalOpen);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPopularSearches();
      loadRecentSearches();
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const loadPopularSearches = async () => {
    try {
      const response = await searchAPI.getPopular();
      setPopularSearches(response.data.data.searches || []);
    } catch (error) {
      console.error('Error loading popular searches:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.getSuggestions(query);
      setSuggestions(response.data.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    // Save to recent searches
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    handleClose();
  };

  const handleClose = () => {
    dispatch(setSearchModalOpen(false));
    setQuery('');
    setSuggestions([]);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="relative p-6 border-b">
              <div className="flex items-center">
                <SearchIcon className="w-6 h-6 text-gray-400 ml-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ابحث عن منتجات، مختبرات، فئات..."
                  className="flex-1 text-lg outline-none placeholder-gray-400"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                  >
                    <XIcon className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Loading State */}
              {loading && (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 ml-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري البحث...
                  </div>
                </div>
              )}
              
              {/* Suggestions */}
              {!loading && suggestions.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">الاقتراحات</h3>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        className="w-full text-right p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                      >
                        <SearchIcon className="w-4 h-4 text-gray-400 ml-3" />
                        <span className="flex-1">{suggestion}</span>
                        <SparklesIcon className="w-4 h-4 text-blue-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500">البحث الأخير</h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      مسح الكل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                      >
                        <ClockIcon className="w-3 h-3 ml-1.5 text-gray-500" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Popular Searches */}
              {!query && popularSearches.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">عمليات البحث الشائعة</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="inline-flex items-center px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-brand-blue rounded-full text-sm transition-colors"
                      >
                        <TrendingUpIcon className="w-3 h-3 ml-1.5" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Links */}
              {!query && (
                <div className="p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">روابط سريعة</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        navigate('/products?type=sale');
                        handleClose();
                      }}
                      className="p-3 bg-white hover:bg-gray-100 rounded-lg text-center transition-colors"
                    >
                      <span className="text-sm font-medium">منتجات للبيع</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/products?type=exchange');
                        handleClose();
                      }}
                      className="p-3 bg-white hover:bg-gray-100 rounded-lg text-center transition-colors"
                    >
                      <span className="text-sm font-medium">منتجات للتبادل</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/labs');
                        handleClose();
                      }}
                      className="p-3 bg-white hover:bg-gray-100 rounded-lg text-center transition-colors"
                    >
                      <span className="text-sm font-medium">المختبرات</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;