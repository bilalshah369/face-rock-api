import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";
import { auditMiddleware } from "../middlewares/audit.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs (Admin only)
 */

router.post(
  "/",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  auditMiddleware("USER", "USER_ACCOUNT"),
  controller.create
);

router.get("/", authMiddleware, allowRoles([ROLES.NTA_ADMIN]), controller.list);

router.get(
  "/:id",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.getById
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.update
);

router.put(
  "/:id/activate",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.activate
);

router.put(
  "/:id/deactivate",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.deactivate
);

router.put(
  "/:id/reset-password",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.resetPwd
);

export default router;
