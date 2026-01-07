import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3";
import db from "../config/db";

const QR_SECRET = process.env.QR_SECRET_KEY!;
const QR_IV = CryptoJS.enc.Utf8.parse(process.env.QR_IV_KEY!);
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

export const generateStudentQrCode = async (
  applicationRef: string,
  userId: number
) => {
  /* ================= FETCH STUDENT ================= */
  const { rows } = await db.query(
    `
    SELECT
      application_ref_no,
      student_first_name,
      student_last_name,
      mobile_no,
      exam_name,
      exam_date,
      shift, face_embedding,
      face_model 
    FROM student_applications
    WHERE application_ref_no = $1
    `,
    [applicationRef]
  );

  if (!rows.length) {
    throw new Error("Application reference not found");
  }

  const student = rows[0];

  /* ================= CREATE PAYLOAD ================= */
  const payload = JSON.stringify({
    application_ref_no: student.application_ref_no,
    //exam_name: student.exam_name,
    //exam_date: student.exam_date,
    //shift: student.shift,
    //mobile_no: student.mobile_no,
    //model: student.face_model,
    face_embedding: student.face_embedding,
  });

  /* ================= ENCRYPT ================= */
  const encrypted = CryptoJS.AES.encrypt(
    payload,
    CryptoJS.enc.Utf8.parse(QR_SECRET),
    { iv: QR_IV }
  ).toString();

  /* ================= GENERATE QR BUFFER ================= */
  const qrBuffer = await QRCode.toBuffer(encrypted, {
    width: 300,
    margin: 2,
  });

  /* ================= S3 KEY ================= */
  const s3Key = `student-qrcodes/${student.exam_name}/${applicationRef}.png`;

  /* ================= UPLOAD TO S3 ================= */
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: qrBuffer,
      ContentType: "image/png",
    })
  );

  /* ================= UPDATE DB ================= */
  await db.query(
    `
    UPDATE student_applications
    SET
      qr_code = $1,
      application_status='APPROVED',
      encrypted_qr_payload = $2,
      date_of_qr_generation = NOW(),
      updated_by = $3,
      updated_at = NOW()
    WHERE application_ref_no = $4
    `,
    [s3Key, encrypted, userId, applicationRef]
  );

  /* ================= PUBLIC URL ================= */
  const qrImageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;

  return {
    qr_image_url: qrImageUrl,
    encrypted_payload: encrypted,
    s3_key: s3Key,
  };
};
