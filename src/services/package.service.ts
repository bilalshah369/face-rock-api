import db from "../config/db";

export const createOuterPackage = async (data: any, userId: number) => {
  const query = `
    INSERT INTO outer_packages
      (tracking_id, destination_centre_id, encrypted_qr_payload, created_by)
    VALUES ($1, $2, $3, $4)
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
    data.encrypted_qr_payload,
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
