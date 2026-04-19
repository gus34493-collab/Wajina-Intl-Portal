"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');
const checkRole = require('../middleware/rbac');
const authenticate = require('../middleware/auth');
// Parent submits a complaint
router.post('/', authenticate, checkRole(['PARENT']), complaintsController.submitComplaint);
// Get complaints (role-based logic)
router.get('/', authenticate, checkRole(['ADMIN_STAFF', 'DIRECTOR']), complaintsController.getComplaints);
// Resolve a complaint
router.put('/:id/resolve', authenticate, checkRole(['ADMIN_STAFF', 'DIRECTOR']), complaintsController.resolveComplaint);
exports.default = router;
