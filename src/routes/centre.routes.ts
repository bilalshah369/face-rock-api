import { Router } from "express";
import * as controller from "../controllers/centre.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Centres
 */

router.post(
  "/",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.create
);

router.get("/", authMiddleware, controller.list);

router.post(
  "/centre-package-route",
  authMiddleware,
  controller.saveCentrePackageRoute
);
router.get(
  "/centre-package-route/:centre_id",
  authMiddleware,
  controller.getCentrePackageRoute
);

export default router;
