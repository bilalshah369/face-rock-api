import db from "../config/db";
import CryptoJS from "crypto-js";
const QR_SECRET = process.env.QR_SECRET_KEY!;
const QR_IV = CryptoJS.enc.Utf8.parse(process.env.QR_IV_KEY!);
export const createOuterPackage = async (data: any, userId: number) => {
  // Encrypt payload
  const encrypted = CryptoJS.AES.encrypt(
    data.encrypted_qr_payload,
    CryptoJS.enc.Utf8.parse(QR_SECRET),
    { iv: QR_IV }
  ).toString();
  const query = `
    INSERT INTO outer_packages
      (tracking_id, destination_centre_id, encrypted_qr_payload, created_by)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (tracking_id)
    DO UPDATE SET
      destination_centre_id = EXCLUDED.destination_centre_id,
      encrypted_qr_payload = EXCLUDED.encrypted_qr_payload,
      updated_by = $4,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    data.tracking_id,
    data.destination_centre_id,
    data.encrypted_qr_payload,
    userId,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

export const createInnerPackage = async (data: any, userId: number) => {
  // Encrypt payload
  const encrypted = CryptoJS.AES.encrypt(
    data.encrypted_qr_payload,
    CryptoJS.enc.Utf8.parse(QR_SECRET),
    { iv: QR_IV }
  ).toString();
  const query = `
    INSERT INTO inner_packages
      (tracking_id, outer_package_id, centre_id, exam_date, encrypted_qr_payload, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    data.tracking_id,
    data.outer_package_id,
    data.centre_id,
    data.exam_date,
    encrypted,
    userId,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

export const getPackageByTracking = async (trackingId: string) => {
  const outer = await db.query(
    `SELECT * FROM outer_packages WHERE tracking_id = $1`,
    [trackingId]
  );

  const inner = await db.query(
    `SELECT * FROM inner_packages WHERE tracking_id = $1`,
    [trackingId]
  );

  return {
    outer: outer.rows[0] || null,
    inner: inner.rows[0] || null,
  };
};

export const getInnerPackageByPackageId = async (trackingId: string) => {
  const inner = await db.query(
    `SELECT * FROM inner_packages WHERE outer_package_id = $1`,
    [trackingId]
  );

  return {
    inner: inner.rows || null,
  };
};
