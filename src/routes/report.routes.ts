import { Router } from "express";
import * as controller from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Dashboard & reporting APIs
 */

router.get(
  "/summary",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.overall
);

router.get(
  "/centre-wise",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.centreWise
);

router.get(
  "/scan-activity",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.scanStats
);

router.get(
  "/user-scans",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.userScans
);

router.get(
  "/alerts",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.alerts
);

export default router;
