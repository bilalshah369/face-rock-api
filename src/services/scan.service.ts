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
  scan_status?: string;
  centre_id?: number;
}

export const saveScan = async (scan: ScanPayload, userId: number) => {
  const scanQuery = `
    INSERT INTO scan_logs
      (tracking_id, qr_type, scanned_by, scanned_phone,
       scan_datetime, latitude, longitude,
       scan_mode, device_id, created_by,scan_status,centre_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
    scan.scan_status,
    scan.centre_id,
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

type ScanPoint = {
  latitude: number;
  longitude: number;
  scan_status: string;
  scan_datetime: string;
  centre_name: string;
};

type DestinationJourney = {
  destinationId: string;
  destinationLocation: ScanPoint;
  scans: ScanPoint[];
};

export const getScanJourney = async (
  trackingId: string
): Promise<DestinationJourney[]> => {
  const { rows } = await db.query(
    `
   SELECT 
  -- scan info
  a.scan_id,
  a.tracking_id,
  a.qr_type,
  a.scan_datetime,
  a.latitude,
  a.longitude,
  a.scan_status,

  -- user (who scanned)
  u.user_id AS scanned_by_user_id,
  u.full_name AS scanned_by_name,

  -- destination centre
  c.centre_id,
  c.latitude AS centre_latitude,
  c.longitude AS centre_longitude,
  c.centre_name,

  -- package info
  p.package_id,
  p.package_type,
  p.status,
  p.exam_date,
  p.dispatch_datetime,
  p.return_dispatch_datetime,
  p.created_on AS package_created_on

FROM scan_logs a
LEFT JOIN users u
  ON a.scanned_by = u.user_id
  LEFT JOIN vw_all_packages p
  ON lower(p.tracking_id) = lower(a.tracking_id)
LEFT JOIN centres c
  ON p.centre_id = c.centre_id


WHERE ($1::text IS NULL OR lower(a.tracking_id) = lower($1::text))
ORDER BY a.scan_datetime ASC;

    `,
    [trackingId ?? null]
  );

  const journeyMap = new Map<number, DestinationJourney>();

  for (const row of rows) {
    const centreId = row.centre_id;

    if (!centreId) continue;

    if (!journeyMap.has(centreId)) {
      journeyMap.set(centreId, {
        destinationId: String(centreId),
        destinationLocation: {
          latitude: Number(row.centre_latitude),
          longitude: Number(row.centre_longitude),
          scan_status: "Destination",
          scan_datetime: "-",
          centre_name: row.centre_name,
        },
        scans: [],
      });
    }

    journeyMap.get(centreId)!.scans.push({
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      scan_status: row.scan_status,
      scan_datetime: row.scan_datetime,
      centre_name: "-",
    });
  }

  return Array.from(journeyMap.values());
};
