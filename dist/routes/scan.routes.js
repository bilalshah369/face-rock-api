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
const controller = __importStar(require("../controllers/scan.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const roles_1 = require("../utils/roles");
const audit_middleware_1 = require("../middlewares/audit.middleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /scans/sync:
 *   post:
 *     summary: Sync offline scans from mobile
 *     tags: [Scans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scans]
 *             properties:
 *               scans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - tracking_id
 *                     - qr_type
 *                     - scan_datetime
 *                     - scan_mode
 *                   properties:
 *                     tracking_id:
 *                       type: string
 *                     qr_type:
 *                       type: string
 *                       enum: [OUTER, INNER]
 *                     scan_datetime:
 *                       type: string
 *                       example: "2025-01-10T10:30:00Z"
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     scan_mode:
 *                       type: string
 *                       enum: [OFFLINE, ONLINE]
 *                     device_id:
 *                       type: string
 *                     scanned_phone:
 *                       type: string
 *     responses:
 *       200:
 *         description: Scans synced successfully
 */
router.post("/sync", auth_middleware_1.authMiddleware, (0, rbac_middleware_1.allowRoles)([roles_1.ROLES.NTA_ADMIN, roles_1.ROLES.DISPATCH, roles_1.ROLES.CENTRE_USER]), (0, audit_middleware_1.auditMiddleware)("SCAN", "QR_SCAN"), controller.syncScans);
router.post("/single", auth_middleware_1.authMiddleware, controller.singleScan);
router.get("/:trackingId", auth_middleware_1.authMiddleware, controller.getScans);
exports.default = router;
