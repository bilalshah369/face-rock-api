import { Router } from "express";
import * as controller from "../controllers/studentApplication.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/rbac.middleware";
import { auditMiddleware } from "../middlewares/audit.middleware";
import { ROLES } from "../utils/roles";
import { enrollStudentFace } from "../services/faceEnrollment.service";
const router = Router();
router.post(
  "/bulk-upload",
  authMiddleware,
  controller.bulkUploadStudentApplications
);
router.get(
  "/ViewStudentApplications",
  authMiddleware,
  controller.viewStudentApplications
);
router.post(
  "/bulk-generate-qr",
  authMiddleware,
  allowRoles([ROLES.NTA_ADMIN, ROLES.DISPATCH]),
  controller.createStudentQrBulk
);

router.post("/enroll-face", authMiddleware, async (req, res) => {
  try {
    const { application_ref_no, photo_path } = req.body;
    const userId = req.user.user_id;

    const result = await enrollStudentFace(
      application_ref_no,
      photo_path,
      userId
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});
export default router;
