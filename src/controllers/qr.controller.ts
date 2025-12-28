import { Request, Response } from "express";
import { bulkGenerateQrCodes, generateQrCode } from "../services/qr.service";
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
export const createQrBulk = async (req: Request, res: Response) => {
  try {
    const filters = req.body;

    // ⚠️ Filters are OPTIONAL (frontend may send only centre)
    const result = await bulkGenerateQrCodes(filters, req.user.user_id);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || "Bulk QR generation failed",
    });
  }
};

// export const getQr = async (req: Request, res: Response) => {
//   const { trackingId } = req.params;

//   const { rows } = await db.query(
//     `
//     SELECT *
//     FROM public.vw_all_packages_qr
//     WHERE tracking_id = $1
//     ORDER BY qr_type DESC, created_on ASC
//     `,
//     [trackingId]
//   );

//   if (!rows.length) {
//     return res.status(404).json({ success: false, message: "QR not found" });
//   }

//   const data = rows.map((r) => ({
//     package_id: r.package_id,
//     tracking_id: r.tracking_id,
//     qr_type: r.qr_type,
//     status: r.status,
//     centre_id: r.centre_id,
//     outer_package_id: r.outer_package_id,
//     outer_tracking_id: r.outer_tracking_id,
//     exam_date: r.exam_date,
//     dispatch_datetime: r.dispatch_datetime,
//     return_dispatch_datetime: r.return_dispatch_datetime,
//     created_on: r.created_on,
//     qr_image_url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${r.qr_image_path}`,
//     encrypted_payload: r.encrypted_payload,
//   }));

//   res.json({
//     success: true,
//     data,
//   });
// };

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
export const printCentreWiseQR = async (req: Request, res: Response) => {
  try {
    const { centre } = req.query;

    if (!centre) {
      return res.status(400).json({
        success: false,
        message: "Centre id is required",
      });
    }

    const { rows } = await db.query(
      `
      SELECT
        qr.package_id,
        qr.tracking_id,
        qr.qr_type,
        qr.status,
        qr.centre_id,
        qr.outer_package_id,
        qr.outer_tracking_id,
        qr.exam_date,
        qr.dispatch_datetime,
        qr.return_dispatch_datetime,
        qr.created_on,
        qr.qr_image_path,
        qr.encrypted_payload,
        ct.centre_code,
        ct.centre_name
      FROM public.vw_all_packages_qr qr left join centres ct on qr.centre_id=ct.centre_id
      WHERE qr.centre_id = $1
      ORDER BY
        qr.outer_tracking_id NULLS FIRST,
        qr.qr_type DESC,         -- OUTER first 
        qr.created_on ASC
      `,
      [centre]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No QR data found for this centre",
      });
    }

    const data = rows.map((r) => ({
      package_id: r.package_id,
      tracking_id: r.tracking_id,
      qr_type: r.qr_type,
      status: r.status,
      centre_id: r.centre_id,
      centre_code: r.centre_code,
      centre_name: r.centre_name,
      outer_package_id: r.outer_package_id,
      outer_tracking_id: r.outer_tracking_id,
      exam_date: r.exam_date,
      dispatch_datetime: r.dispatch_datetime,
      return_dispatch_datetime: r.return_dispatch_datetime,
      created_on: r.created_on,
      qr_image_url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${r.qr_image_path}`,
      encrypted_payload: r.encrypted_payload,
    }));

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("printCentreWiseQR error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
