import db from "../config/db";

export interface ScanPayload {
  tracking_id: string;
  qr_type: "OUTER" | "INNER";
  scan_datetime: string;
  latitude?: number;
  longitude?: number;
  scan_mode: "OFFLINE" | "ONLINE";
  device_id?: string;
  scanned_phone?: string;
}

export const saveScan = async (scan: ScanPayload, userId: number) => {
  const scanQuery = `
    INSERT INTO scan_logs
      (tracking_id, qr_type, scanned_by, scanned_phone,
       scan_datetime, latitude, longitude,
       scan_mode, device_id, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING scan_id;
  `;

  const values = [
    scan.tracking_id,
    scan.qr_type,
    userId,
    scan.scanned_phone || null,
    scan.scan_datetime,
    scan.latitude || null,
    scan.longitude || null,
    scan.scan_mode,
    scan.device_id || null,
    userId,
  ];

  const result = await db.query(scanQuery, values);

  // Create movement event
  const eventQuery = `
    INSERT INTO package_events
      (tracking_id,    event_type, event_datetime, user_id,
       latitude, longitude, created_by)
    VALUES ($1,'IN_TRANSIT',$2,$3,$4,$5,$6);
  `;

  await db.query(eventQuery, [
    scan.tracking_id,
    scan.scan_datetime,
    userId,
    scan.latitude || null,
    scan.longitude || null,
    userId,
  ]);

  return result.rows[0];
};

export const getScanHistory = async (trackingId: string) => {
  const { rows } = await db.query(
    `
   SELECT b.full_name,a.*
    FROM scan_logs a
	left join users b on a.scanned_by=b.user_id
    WHERE lower(a.tracking_id) = $1
    ORDER BY a.scan_datetime ASC
    `,
    [trackingId?.toLowerCase() || ""]
  );

  return rows;
};
