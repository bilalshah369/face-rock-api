import { Router } from "express";
import * as controller from "../controllers/scan.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";
import { auditMiddleware } from "../middlewares/audit.middleware";

const router = Router();

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

router.post(
  "/sync",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH, ROLES.CENTRE_USER]),
  auditMiddleware("SCAN", "QR_SCAN"),
  controller.syncScans
);
router.post("/single", authMiddleware, controller.singleScan);
router.get("/:trackingId", authMiddleware, controller.getScans);
router.get("/getJourney/:trackingId", authMiddleware, controller.getJourney);

export default router;
