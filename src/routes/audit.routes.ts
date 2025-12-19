import { Router } from "express";
import { list } from "../controllers/audit.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Immutable audit logs (Admin only)
 */

router.get("/", authMiddleware, allowRoles([ROLES.NTA_ADMIN]), list);

export default router;
