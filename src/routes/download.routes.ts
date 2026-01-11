// src/routes/download.routes.ts
import { Router } from "express";
import path from "path";
import fs from "fs";

const router = Router();

router.get("/apk", (req, res) => {
  const apkPath = path.resolve(__dirname, "../../files/NTA_Face_App.apk");

  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({ message: "APK not found" });
  }

  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", "attachment; filename=NTA_Fcae_App.apk");

  res.sendFile(apkPath);
});

export default router;
