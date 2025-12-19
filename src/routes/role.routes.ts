import { Router } from "express";
import * as controller from "../controllers/role.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role master APIs (Admin only)
 */

router.post(
  "/",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
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

export default router;
