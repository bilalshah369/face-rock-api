import { Router } from "express";
import * as controller from "../controllers/package.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { auditMiddleware } from "../middlewares/audit.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

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

router.post(
  "/outer",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  auditMiddleware("PACKAGE", "OUTER_PACKAGE"),
  controller.createOuter
);
router.get(
  "/",
  authMiddleware,
  // allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.getAllPackages
);
router.get(
  "/ViewPackages",
  authMiddleware,
  // allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.getAllPackagesView
);
router.get(
  "/ViewPackages/:trackingId",
  authMiddleware,
  // allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.getAllPackagesView
);
router.get(
  "/getInnerPackageByOuterPackageId/:outer_package_id",
  authMiddleware,
  // allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.getInnerPackageByPackageId
);
router.post("/inner", authMiddleware, controller.createInner);
router.get("/:trackingId", authMiddleware, controller.getPackage);
router.post(
  "/:trackingId/events",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH, ROLES.CENTRE_USER]),
  auditMiddleware("PACKAGE", "PACKAGE_EVENT"),
  controller.addEvent
);

router.get("/:trackingId/events", authMiddleware, controller.getEvents);
export default router;
