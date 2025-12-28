import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3";
import db from "../config/db";

const QR_SECRET = process.env.QR_SECRET_KEY!;
const QR_IV = CryptoJS.enc.Utf8.parse(process.env.QR_IV_KEY!);
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export const generateQrCode = async (
  trackingId: string,
  qrType: "OUTER" | "INNER",
  payloadData: any,
  userId: number
) => {
  //Gt details from db
  const { rows } = await db.query(
    `
  SELECT
    p.tracking_id,
    p.encrypted_qr_payload,
    c.centre_name,c.centre_code,
    p.package_type
  FROM (
    SELECT
      tracking_id,
      encrypted_qr_payload,
      destination_centre_id as centre_id,
      'OUTER' AS package_type
    FROM public.outer_packages
    WHERE tracking_id = $1

    UNION ALL

    SELECT
      tracking_id,
      encrypted_qr_payload,
      centre_id,
      'INNER' AS package_type
    FROM public.inner_packages
    WHERE tracking_id = $1
  ) p
  JOIN centres c ON c.centre_id = p.centre_id
  LIMIT 1
  `,
    [trackingId]
  );
  if (rows.length === 0) {
    throw new Error("Tracking ID not found");
  }
  const packageData = rows[0];

  // 1️⃣ Create payload
  const payload = JSON.stringify({
    tracking_id: trackingId,
    qr_type: qrType,
    centre_name: packageData.centre_name,
    encrypted_qr_payload: packageData.encrypted_qr_payload,
    //package_type: packageData.package_type,
    ...payloadData,
  });

  // 2️⃣ Encrypt payload
  const encrypted = CryptoJS.AES.encrypt(
    payload,
    CryptoJS.enc.Utf8.parse(QR_SECRET),
    { iv: QR_IV }
  ).toString();

  // 3️⃣ Generate QR as BUFFER
  const qrBuffer = await QRCode.toBuffer(encrypted, {
    width: 300,
    margin: 2,
  });

  // 4️⃣ S3 key (path)
  const s3Key = `qrcodes/${trackingId}_${qrType}.png`;

  // 5️⃣ Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: qrBuffer,
      ContentType: "image/png",
    })
  );

  // 6️⃣ Store metadata in DB
  // await db.query(
  //   `INSERT INTO qr_codes
  //    (tracking_id, qr_type, encrypted_payload, qr_image_path, created_by)
  //    VALUES ($1, $2, $3, $4, $5)`,
  //   [trackingId, qrType, encrypted, s3Key, userId]
  // );
  await db.query(
    `
  INSERT INTO qr_codes
    (tracking_id, qr_type, encrypted_payload, qr_image_path, created_by)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (tracking_id)
  DO UPDATE SET
    encrypted_payload = EXCLUDED.encrypted_payload,
    qr_image_path = EXCLUDED.qr_image_path,
    updated_by = $5,
    updated_on = NOW()
  `,
    [trackingId, qrType, encrypted, s3Key, userId]
  );

  // 7️⃣ Public URL (works only if bucket is public)
  const qrImageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;

  return {
    qr_image_url: qrImageUrl,
    encrypted_payload: encrypted,
    s3_key: s3Key,
  };
};
const getPackagesForBulkQR = async (filters: any) => {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.centre) {
    values.push(filters.centre);
    conditions.push(`centre_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  if (filters.from_date) {
    values.push(filters.from_date);
    conditions.push(`created_on >= $${values.length}`);
  }

  if (filters.to_date) {
    values.push(filters.to_date);
    conditions.push(`created_on <= $${values.length}`);
  }

  if (filters.tracking_id) {
    values.push(filters.tracking_id);
    conditions.push(`tracking_id = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const { rows } = await db.query(
    `
    SELECT tracking_id,package_type 
    FROM public.vw_all_packages
    ${whereClause}
    `,
    values
  );

  return rows;
};

export const bulkGenerateQrCodes = async (filters: any, userId: number) => {
  try {
    //debugger;
    const packages = await getPackagesForBulkQR(filters);

    if (!packages.length) {
      return {
        total: 0,
        generated_count: 0,
        failed_count: 0,
        failed_tracking_ids: [],
      };
    }

    let successCount = 0;
    let failed: string[] = [];

    // 🔹 batch size (safe for S3 + CPU)
    const BATCH_SIZE = 10;

    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
      const batch = packages.slice(i, i + BATCH_SIZE);

      for (const pkg of batch) {
        try {
          await generateQrCode(pkg.tracking_id, pkg.package_type, {}, userId);
          successCount++;
        } catch (err) {
          console.error("QR failed:", pkg.tracking_id, err);
          failed.push(pkg.tracking_id);
        }
      }
    }

    return {
      total: packages.length,
      generated_count: successCount,
      failed_count: failed.length,
      failed_tracking_ids: failed,
    };
  } catch (error) {
    console.error(error);
    return {
      total: 0,
      generated_count: 0,
      failed_count: 0,
      failed_tracking_ids: [],
    };
  }
};
