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
const controller = __importStar(require("../controllers/package.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const audit_middleware_1 = require("../middlewares/audit.middleware");
const roles_1 = require("../utils/roles");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /packages/outer:
 *   post:
 *     summary: Create outer package
 *     tags: [Packages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tracking_id
 *               - destination_centre_id
 *               - encrypted_qr_payload
 *             properties:
 *               tracking_id:
 *                 type: string
 *               destination_centre_id:
 *                 type: number
 *               encrypted_qr_payload:
 *                 type: string
 *     responses:
 *       200:
 *         description: Outer package created
 */
router.post("/outer", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN, roles_1.ROLES.DISPATCH]), (0, audit_middleware_1.auditMiddleware)("PACKAGE", "OUTER_PACKAGE"), controller.createOuter);
router.post("/inner", auth_middleware_1.authMiddleware, controller.createInner);
router.get("/:trackingId", auth_middleware_1.authMiddleware, controller.getPackage);
exports.default = router;
