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
      updated_on = NOW()
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
  // const encrypted = CryptoJS.AES.encrypt(
  //   data.encrypted_qr_payload,
  //   CryptoJS.enc.Utf8.parse(QR_SECRET),
  //   { iv: QR_IV }
  // ).toString();
  const query = `
  INSERT INTO inner_packages
    (tracking_id, outer_package_id, centre_id, exam_date, encrypted_qr_payload, created_by)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (tracking_id)
  DO UPDATE SET
    outer_package_id      = EXCLUDED.outer_package_id,
    centre_id             = EXCLUDED.centre_id,
    exam_date             = EXCLUDED.exam_date,
    encrypted_qr_payload  = EXCLUDED.encrypted_qr_payload,
    updated_by            = $6,
    updated_on            = NOW()
  RETURNING *;
`;

  const values = [
    data.tracking_id,
    data.outer_package_id,
    data.centre_id,
    data.exam_date,
    data.encrypted_qr_payload,
    userId,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
};

export const getPackageByTracking = async (trackingId: string) => {
  // const outer = await db.query(
  //   `SELECT * FROM outer_packages WHERE tracking_id = $1`,
  //   [trackingId]
  // );

  const outer = await db.query(
    `
  SELECT *,tracking_id as outer_tracking_id 
  FROM outer_packages
  WHERE tracking_id = $1

  UNION ALL

  SELECT o.*,o.tracking_id as outer_tracking_id 
  FROM outer_packages o
  INNER JOIN inner_packages i
    ON i.outer_package_id = o.outer_package_id
  WHERE i.tracking_id = $1
  LIMIT 1
  `,
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
const buildS3Url = (path: string | null) => {
  if (!path) return null;
  //bilal
  const qrImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${
    process.env.AWS_REGION
  }.amazonaws.com/${path.replace(/\\/g, "/")}`;
  return qrImageUrl;
};
export const getInnerPackageByPackageId = async (trackingId: string) => {
  const result = await db.query(
    `SELECT 
    a.tracking_id,
    c.qr_image_path,
    c.encrypted_payload
FROM inner_packages a
INNER JOIN outer_packages b 
    ON a.outer_package_id = b.outer_package_id
INNER JOIN qr_codes c 
    ON a.tracking_id = c.tracking_id
     WHERE b.tracking_id = $1`,
    [trackingId]
  );

  return result.rows.map((row) => ({
    ...row,
    qr_image_url: buildS3Url(row.qr_image_path),
  }));
};
const getCentreMap = async (client: any) => {
  const res = await client.query(`
    SELECT centre_id, centre_code
    FROM centres
    WHERE is_active = true
  `);

  const map = new Map<string, number>();
  res.rows.forEach((r: any) => {
    map.set(r.centre_code.trim(), r.centre_id);
  });

  return map;
};
const getOuterMap = async (client: any) => {
  const res = await client.query(`
    SELECT outer_package_id, tracking_id
    FROM public.outer_packages 
  `);

  const map = new Map<string, number>();
  res.rows.forEach((r: any) => {
    map.set(r.tracking_id.trim(), r.outer_package_id);
  });

  return map;
};
export const bulkCreateOuterPackages = async (rows: any[], userId: number) => {
  const client = await db.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      /* ================= VALIDATION ================= */
      if (!row.tracking_id || !row.encrypted_qr_payload) {
        skipped++;
        continue;
      }
      // 🔥 Load centre master once
      const centreMap = await getCentreMap(client);
      /* ================= RESOLVE CENTRE ================= */
      const centreCode = row.destination_centre_id; // coming as centre_code
      const centreId = centreMap.get(centreCode?.trim());
      /* ================= ENCRYPT ================= */
      // const encrypted = CryptoJS.AES.encrypt(
      //   row.encrypted_qr_payload,
      //   CryptoJS.enc.Utf8.parse(QR_SECRET),
      //   { iv: QR_IV }
      // ).toString();

      const query = `
        INSERT INTO outer_packages
        (
          tracking_id,
          destination_centre_id,
          encrypted_qr_payload,
          status,
          dispatch_datetime,
          return_dispatch_datetime,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (tracking_id)
        DO UPDATE SET
          destination_centre_id = EXCLUDED.destination_centre_id,
          encrypted_qr_payload = EXCLUDED.encrypted_qr_payload,
          status = COALESCE(EXCLUDED.status, outer_packages.status),
          dispatch_datetime = EXCLUDED.dispatch_datetime,
          return_dispatch_datetime = EXCLUDED.return_dispatch_datetime,
          updated_by = $7,
          updated_on = NOW()
        RETURNING xmax = 0 AS inserted;
      `;

      const values = [
        row.tracking_id,
        centreId || null,
        row.encrypted_qr_payload,
        row.status || "CREATED",
        row.dispatch_datetime || null,
        row.return_dispatch_datetime || null,
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
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const bulkCreateInnerPackages = async (rows: any[], userId: number) => {
  const client = await db.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      /* ================= VALIDATION ================= */
      if (
        !row.tracking_id ||
        !row.outer_package_id ||
        !row.centre_id ||
        !row.encrypted_qr_payload
      ) {
        skipped++;
        continue;
      }
      // 🔥 Load centre master once
      const centreMap = await getCentreMap(client);
      /* ================= RESOLVE CENTRE ================= */
      const centreCode = row.centre_id; // coming as centre_code
      const centreId = centreMap.get(centreCode?.trim());

      // 🔥 Load outer package once
      const outerMap = await getOuterMap(client);
      /* ================= RESOLVE Outer ================= */
      const tracking_id = row.outer_package_id; // coming as outer_package_id
      const outer_package_id = outerMap.get(tracking_id?.trim());

      const query = `
        INSERT INTO inner_packages
          (
            tracking_id,
            outer_package_id,
            centre_id,
            exam_date,
            encrypted_qr_payload,
            created_by
          )
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (tracking_id)
        DO UPDATE SET
          outer_package_id     = EXCLUDED.outer_package_id,
          centre_id            = EXCLUDED.centre_id,
          exam_date            = EXCLUDED.exam_date,
          encrypted_qr_payload = EXCLUDED.encrypted_qr_payload,
          updated_by           = $6,
          updated_on           = NOW()
        RETURNING xmax = 0 AS inserted;
      `;

      const values = [
        row.tracking_id,
        outer_package_id,
        centreId,
        row.exam_date || null,
        row.encrypted_qr_payload,
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
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
