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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller = __importStar(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const roles_1 = require("../utils/roles");
const audit_middleware_1 = require("../middlewares/audit.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs (Admin only)
 */
router.post("/", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), (0, audit_middleware_1.auditMiddleware)("USER", "USER_ACCOUNT"), controller.create);
router.get("/", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.list);
router.get("/:id", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.getById);
router.put("/:id", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.update);
router.put("/:id/activate", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.activate);
router.put("/:id/deactivate", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.deactivate);
router.put("/:id/reset-password", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN]), controller.resetPwd);
exports.default = router;
