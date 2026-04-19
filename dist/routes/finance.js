"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financeController = __importStar(require("../controllers/financeController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const FINANCE_ROLES = (0, auth_1.requireRole)('ACCOUNTS_OFFICER', 'BURSAR', 'DIRECTOR');
const DIRECTOR_ONLY = (0, auth_1.requireRole)('DIRECTOR');
// Approve a transaction
router.put('/approve/:transactionId', auth_1.auth, FINANCE_ROLES, financeController.approveTransaction);
// Flag a transaction
router.put('/flag/:transactionId', auth_1.auth, FINANCE_ROLES, financeController.flagTransaction);
// GET /api/finance/dashboard-stats - High performance aggregate stats
router.get('/dashboard-stats', auth_1.auth, DIRECTOR_ONLY, financeController.getDashboardStats);
// GET /api/finance/fees - List fee targets
router.get('/fees', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR', 'BURSAR', 'PRINCIPAL', 'HEAD_TEACHER', 'ACCOUNTS_OFFICER'), financeController.getFeeConfigs);
// POST /api/finance/fees - Upsert fee target (DIRECTOR ONLY)
router.post('/fees', auth_1.auth, DIRECTOR_ONLY, financeController.upsertFeeConfig);
// GET /api/finance/revenue-stats - Weekly revenue trend
router.get('/revenue-stats', auth_1.auth, DIRECTOR_ONLY, financeController.getRevenueStats);
// GET /api/finance/student-balances - Get payment status for all students
router.get('/student-balances', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR', 'BURSAR', 'PRINCIPAL', 'ACCOUNTS_OFFICER'), financeController.getStudentBalances);
exports.default = router;
