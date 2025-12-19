import { Router } from "express";
import * as controller from "../controllers/city.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cities
 */

router.post(
  "/",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN]),
  controller.create
);

router.get("/", authMiddleware, controller.list);

export default router;
