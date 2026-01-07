// services/studentApplication.service.ts
import db from "../config/db";
import { generateStudentQrCode } from "../utils/studentQrGenerator";

interface StudentApplicationRow {
  application_ref_no: string;
  student_first_name: string;
  student_last_name?: string;
  date_of_birth: string;
  gender?: string;
  email?: string;
  mobile_no: string;

  exam_name: string;
  exam_date: string;
  shift: string;

  photo?: string;
  qr_code?: string;
  date_of_qr_generation?: string;

  application_status?: string;
  payment_status?: string;
}
interface QueryParams {
  page: number;
  limit: number;
  application_ref_no?: any;
  exam_name?: any;
  shift?: any;
  status?: any;
  from_date?: any;
  to_date?: any;
}
const buildS3Url = (path: string | null) => {
  if (!path) return null;

  const qrImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${
    process.env.AWS_REGION
  }.amazonaws.com/${path.replace(/\\/g, "/")}`;
  return qrImageUrl;
};
export const getStudentApplications = async ({
  page,
  limit,
  application_ref_no,
  exam_name,
  shift,
  status,
  from_date,
  to_date,
}: QueryParams) => {
  const offset = (page - 1) * limit;
  const values: any[] = [];
  let where = "WHERE is_active = true";

  if (application_ref_no) {
    values.push(`%${application_ref_no}%`);
    where += ` AND application_ref_no ILIKE $${values.length}`;
  }

  if (exam_name) {
    values.push(`%${exam_name}%`);
    where += ` AND exam_name ILIKE $${values.length}`;
  }

  if (shift) {
    values.push(shift);
    where += ` AND shift = $${values.length}`;
  }

  if (status) {
    values.push(status);
    where += ` AND application_status = $${values.length}`;
  }

  if (from_date) {
    values.push(from_date);
    where += ` AND exam_date >= $${values.length}`;
  }

  if (to_date) {
    values.push(to_date);
    where += ` AND exam_date <= $${values.length}`;
  }

  const dataQuery = `
    SELECT
      *
    FROM student_applications
    ${where}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM student_applications
    ${where};
  `;

  let [dataRes, countRes] = await Promise.all([
    db.query(dataQuery, values),
    db.query(countQuery, values),
  ]);

  return {
    data: dataRes.rows.map((row) => ({
      ...row,
      qr_image_url: buildS3Url(row.qr_code),
    })),
    page,
    limit,
    count: countRes.rows[0].count,
  };
};

export const bulkCreateStudentApplications = async (
  rows: StudentApplicationRow[],
  userId: number
) => {
  const client = await db.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      /* ================= VALIDATION ================= */
      if (
        !row.application_ref_no ||
        !row.student_first_name ||
        !row.mobile_no ||
        !row.exam_name ||
        !row.exam_date ||
        !row.shift
      ) {
        skipped++;
        continue;
      }

      const query = `
        INSERT INTO student_applications
        (
          application_ref_no,
          student_first_name,
          student_last_name,
          date_of_birth,
          gender,
          email,
          mobile_no,
          exam_name,
          exam_date,
          shift,
          photo,
          qr_code,
          date_of_qr_generation,
          application_status,
          payment_status,
          created_by
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,
          $11,$12,$13,
          $14,$15,$16
        )
        ON CONFLICT (application_ref_no)
        DO UPDATE SET
          student_first_name = EXCLUDED.student_first_name,
          student_last_name = EXCLUDED.student_last_name,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender,
          email = EXCLUDED.email,
          mobile_no = EXCLUDED.mobile_no,
          exam_name = EXCLUDED.exam_name,
          exam_date = EXCLUDED.exam_date,
          shift = EXCLUDED.shift,
          photo = EXCLUDED.photo,
          qr_code = EXCLUDED.qr_code,
          date_of_qr_generation = EXCLUDED.date_of_qr_generation,
          application_status = COALESCE(
            EXCLUDED.application_status,
            student_applications.application_status
          ),
          payment_status = COALESCE(
            EXCLUDED.payment_status,
            student_applications.payment_status
          ),
          updated_by = $16,
          updated_at = NOW()
        RETURNING xmax = 0 AS inserted;
      `;

      const values = [
        row.application_ref_no,
        row.student_first_name,
        row.student_last_name || null,
        row.date_of_birth,
        row.gender || null,
        row.email || null,
        row.mobile_no,

        row.exam_name,
        row.exam_date,
        row.shift,

        row.photo || null,
        row.qr_code || null,
        row.date_of_qr_generation || null,

        row.application_status || "PENDING",
        row.payment_status || "UNPAID",
        userId,
      ];

      const result = await client.query(query, values);

      if (result.rows[0]?.inserted) inserted++;
      else updated++;
    }

    await client.query("COMMIT");

    return {
      success: true,
      total: rows.length,
      inserted,
      updated,
      skipped,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
// services/studentQr.service.ts
const getStudentsForBulkQR = async (filters: any) => {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.exam_name) {
    values.push(filters.exam_name);
    conditions.push(`exam_name = $${values.length}`);
  }

  if (filters.shift) {
    values.push(filters.shift);
    conditions.push(`shift = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`application_status = $${values.length}`);
  }

  if (filters.from_date) {
    values.push(filters.from_date);
    conditions.push(`created_at >= $${values.length}`);
  }

  if (filters.to_date) {
    values.push(filters.to_date);
    conditions.push(`created_at <= $${values.length}`);
  }

  if (filters.application_ref_no) {
    values.push(filters.application_ref_no);
    conditions.push(`application_ref_no = $${values.length}`);
  }
  // MULTIPLE refs (checkbox-based selection)
  if (
    filters.application_ref_nos &&
    Array.isArray(filters.application_ref_nos) &&
    filters.application_ref_nos.length > 0
  ) {
    values.push(filters.application_ref_nos);
    conditions.push(`application_ref_no = ANY($${values.length})`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const { rows } = await db.query(
    `
    SELECT
      application_ref_no,
      student_first_name,
      student_last_name,
      mobile_no,
      exam_name,
      exam_date,
      shift
    FROM student_applications
    ${whereClause}
    `,
    values
  );

  return rows;
};

export const bulkGenerateStudentQrCodes = async (
  filters: any,
  userId: number
) => {
  try {
    const students = await getStudentsForBulkQR(filters);

    if (!students.length) {
      return {
        total: 0,
        generated_count: 0,
        failed_count: 0,
        failed_application_refs: [],
      };
    }

    let successCount = 0;
    let failed: string[] = [];

    const BATCH_SIZE = 10;

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);

      for (const student of batch) {
        try {
          await generateStudentQrCode(student.application_ref_no, userId);
          successCount++;
        } catch (err) {
          console.error("Student QR failed:", student.application_ref_no, err);
          failed.push(student.application_ref_no);
        }
      }
    }

    return {
      total: students.length,
      generated_count: successCount,
      failed_count: failed.length,
      failed_application_refs: failed,
    };
  } catch (error) {
    console.error(error);
    return {
      total: 0,
      generated_count: 0,
      failed_count: 0,
      failed_application_refs: [],
    };
  }
};
