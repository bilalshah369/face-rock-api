"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowRoles = void 0;
const allowRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role_id) {
            return res.status(403).json({
                message: "Access denied",
            });
        }
        const userRole = Number(req.user.role_id);
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }
        next();
    };
};
exports.allowRoles = allowRoles;
