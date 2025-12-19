import { Router } from "express";
import db from "../config/db";
import authRoutes from "./auth.routes";

import { authMiddleware } from "../middlewares/auth.middleware";
import packageRoutes from "./package.routes";
import scanRoutes from "./scan.routes";
import stateRoutes from "./state.routes";
import cityRoutes from "./city.routes";
import centreRoutes from "./centre.routes";
import roleRoutes from "./role.routes";
import userRoutes from "./user.routes";
import auditRoutes from "./audit.routes";
import reportRoutes from "./report.routes";
import qrRoutes from "./qr.routes";
const router = Router();
router.use("/audit", auditRoutes);

router.use("/reports", reportRoutes);

router.use("/users", userRoutes);
router.use("/masters/roles", roleRoutes);
router.use("/masters/states", stateRoutes);
router.use("/masters/cities", cityRoutes);
router.use("/masters/centres", centreRoutes);
router.use("/scans", scanRoutes);
router.use("/auth", authRoutes);
router.use("/packages", packageRoutes);

router.use("/qrcode", qrRoutes);
router.get("/health", async (_req, res) => {
  const result = await db.query("SELECT NOW()");
  res.json({
    status: "OK",
    dbTime: result.rows[0].now,
  });
});
router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You are authenticated" });
});
export default router;
