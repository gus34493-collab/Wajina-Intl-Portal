"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// RBAC middleware for Express
module.exports = function checkRole(allowedRoles) {
    return (req, res, next) => {
        const { user } = req;
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
        }
        next();
    };
};
