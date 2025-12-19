import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import fs from "fs";
import path from "path";
import db from "../config/db";

const QR_SECRET = process.env.QR_SECRET_KEY!;
const QR_IV = CryptoJS.enc.Utf8.parse(process.env.QR_IV_KEY!);
const QR_DIR = process.env.QR_UPLOAD_PATH!;

export const generateQrCode = async (
  trackingId: string,
  qrType: "OUTER" | "INNER",
  payloadData: any,
  userId: number
) => {
  // 1. Create payload
  const payload = JSON.stringify({
    tracking_id: trackingId,
    qr_type: qrType,
    ...payloadData,
  });

  // 2. Encrypt payload
  const encrypted = CryptoJS.AES.encrypt(
    payload,
    CryptoJS.enc.Utf8.parse(QR_SECRET),
    { iv: QR_IV }
  ).toString();

  // 3. Ensure directory exists
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }

  // 4. Generate QR image
  const fileName = `${trackingId}_${qrType}.png`;
  const filePath = path.join(QR_DIR, fileName);

  await QRCode.toFile(filePath, encrypted, {
    width: 300,
    margin: 2,
  });

  // 5. Store in DB
  await db.query(
    `INSERT INTO qr_codes
     (tracking_id, qr_type, encrypted_payload, qr_image_path, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [trackingId, qrType, encrypted, filePath, userId]
  );

  return {
    qr_image_url: `${process.env.BASE_URL}/${filePath}`,
    encrypted_payload: encrypted,
  };
};
