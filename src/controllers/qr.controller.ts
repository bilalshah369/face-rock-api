import { Request, Response } from "express";
import { generateQrCode } from "../services/qr.service";
import db from "../config/db";
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;
export const createQr = async (req: Request, res: Response) => {
  const { tracking_id, qr_type, payload } = req.body;

  if (!tracking_id || !qr_type) {
    return res
      .status(400)
      .json({ message: "tracking_id and qr_type required" });
  }

  const result = await generateQrCode(
    tracking_id,
    qr_type,
    payload || {},
    req.user.user_id
  );

  res.json({ success: true, data: result });
};

export const getQr = async (req: Request, res: Response) => {
  const { trackingId } = req.params;

  const { rows } = await db.query(
    `SELECT tracking_id, qr_type, qr_image_path,encrypted_payload
     FROM qr_codes
     WHERE tracking_id = $1 AND is_active = true`,
    [trackingId]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "QR not found" });
  }
  const qrImageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${rows[0].qr_image_path}`;
  res.json({
    success: true,
    data: {
      tracking_id: rows[0].tracking_id,
      qr_type: rows[0].qr_type,
      qr_image_url: qrImageUrl,
      encrypted_payload: rows[0].encrypted_payload,
    },
  });
};
