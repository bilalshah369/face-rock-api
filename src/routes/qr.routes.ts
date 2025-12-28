import { Router } from "express";
import * as controller from "../controllers/qr.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

router.post(
  "/generate",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.createQr
);
router.post(
  "/bulk-generate-qr",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.createQrBulk
);
router.get("/print-centre-wise", authMiddleware, controller.printCentreWiseQR);
router.get("/:trackingId", authMiddleware, controller.getQr);

export default router;
