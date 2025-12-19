"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const roles_1 = require("../utils/roles");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Immutable audit logs (Admin only)
 */
router.get("/", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), audit_controller_1.list);
exports.default = router;
