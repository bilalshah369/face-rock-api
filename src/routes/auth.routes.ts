import { Router } from "express";
import { login, loginWithRole } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/loginWithRole", loginWithRole);

export default router;
