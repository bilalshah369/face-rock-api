import express, { Request, Response } from "express";

const router = express.Router();

type Platform = "android" | "ios";

interface VersionCheckRequestBody {
  platform: Platform;
  versionCode: string; // STRING from app
}

interface VersionCheckResponse {
  versionCode: string;
  forceUpdate: boolean;
  updateUrl: string;
  message: string;
}

const GLOBAL_VERSION: Record<Platform, VersionCheckResponse> = {
  android: {
    versionCode: "262",
    forceUpdate: true,
    //updateUrl: "https://play.google.com/store/apps/details?id=com.myapp",
    updateUrl: "https://nta-face-rock-api.onrender.com/download/apk",
    message: "Please update the app to continue.",
  },
  ios: {
    versionCode: "261",
    forceUpdate: true,
    updateUrl: "https://apps.apple.com/app/idXXXXXXXX",
    message: "Please update the app to continue.",
  },
};

router.post(
  "/version-check",
  (req: Request<{}, {}, VersionCheckRequestBody>, res: Response) => {
    const { platform, versionCode } = req.body;

    if (!platform || !versionCode) {
      return res.status(400).json({
        message: "platform and versionCode are required",
      });
    }

    const serverConfig = GLOBAL_VERSION[platform];
    debugger;
    // 🔑 Only comparison logic
    const shouldForceUpdate =
      serverConfig.forceUpdate && versionCode !== serverConfig.versionCode;

    return res.json({
      versionCode: serverConfig.versionCode,
      forceUpdate: shouldForceUpdate,
      updateUrl: serverConfig.updateUrl,
      message: serverConfig.message,
    });
  }
);

export default router;
