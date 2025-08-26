const express = require('express');
const router = express.Router();
const {
    getAllLabs,
    getPendingLabs,
    getLab,
    approveLab,
    rejectLab,
    suspendLab,
    activateLab,
    updateLab,
    getLabStatistics,
    addLabNote,
    getMyDashboard
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
    labActionValidation,
    rejectLabValidation,
    suspendLabValidation,
    updateLabValidation,
    addLabNoteValidation,
    labQueryValidation,
    labIdValidation
} = require('../validators/labValidators');

// Lab dashboard for authenticated lab user
router.get('/my-dashboard', protect, authorize('lab'), getMyDashboard);

// Admin routes
router.use(protect); // All routes below require authentication

// Get all labs (Admin only)
router.get('/', 
    authorize('admin'), 
    labQueryValidation, 
    handleValidationErrors, 
    getAllLabs
);

// Get pending labs (Admin only)
router.get('/pending', 
    authorize('admin'), 
    labQueryValidation, 
    handleValidationErrors, 
    getPendingLabs
);

// Get single lab (Admin or Lab Owner)
router.get('/:id', 
    labIdValidation, 
    handleValidationErrors, 
    getLab
);

// Lab management actions (Admin only)
router.put('/:id/approve', 
    authorize('admin'), 
    labActionValidation, 
    handleValidationErrors, 
    approveLab
);

router.put('/:id/reject', 
    authorize('admin'), 
    rejectLabValidation, 
    handleValidationErrors, 
    rejectLab
);

router.put('/:id/suspend', 
    authorize('admin'), 
    suspendLabValidation, 
    handleValidationErrors, 
    suspendLab
);

router.put('/:id/activate', 
    authorize('admin'), 
    labActionValidation, 
    handleValidationErrors, 
    activateLab
);

// Add note to lab (Admin only)
router.post('/:id/notes', 
    authorize('admin'), 
    addLabNoteValidation, 
    handleValidationErrors, 
    addLabNote
);

// Update lab profile (Lab Owner only)
router.put('/:id', 
    updateLabValidation, 
    handleValidationErrors, 
    updateLab
);

// Get lab statistics (Admin or Lab Owner)
router.get('/:id/statistics', 
    labIdValidation, 
    handleValidationErrors, 
    getLabStatistics
);

module.exports = router;