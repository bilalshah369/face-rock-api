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
  name?: string;
  face_status?: string;
}

export const saveScan = async (scan: ScanPayload, userId: number) => {
  const scanQuery = `
  INSERT INTO scan_logs
    (
      tracking_id,
      qr_type,
      scanned_by,
      scanned_phone,
      scan_datetime,
      latitude,
      longitude,
      scan_mode,
      device_id,
      created_by,
      scan_status,
      centre_id,
      name,
      face_status
    )
  VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  ON CONFLICT (tracking_id, scan_datetime, device_id)
  DO NOTHING
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
    scan.name,
    scan.face_status,
  ];

  const result = await db.query(scanQuery, values);

  const scanId = result.rows.length > 0 ? result.rows[0].scan_id : null;

  if (scanId !== null) {
    //update status
    try {
      if (scan.qr_type === "OUTER") {
        const updateQuery = `
      UPDATE public.student_applications
      SET application_status = $2
      WHERE application_ref_no = $1
        AND application_status IS DISTINCT FROM 'VERIFIED'
    `;

        await db.query(updateQuery, [scan.tracking_id, scan.face_status]);
      }
    } catch (exp) {
      console.error(exp);
    }
  }

  // Create movement event
  // const eventQuery = `
  //   INSERT INTO package_events
  //     (tracking_id,    event_type, event_datetime, user_id,
  //      latitude, longitude, created_by)
  //   VALUES ($1,'IN_TRANSIT',$2,$3,$4,$5,$6);
  // `;

  // await db.query(eventQuery, [
  //   scan.tracking_id,
  //   scan.scan_datetime,
  //   userId,
  //   scan.latitude || null,
  //   scan.longitude || null,
  //   userId,
  // ]);

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
export const getAllScans = async (scan: any) => {
  const { rows } = await db.query(
    `
    SELECT b.full_name, a.*
    FROM scan_logs a
    LEFT JOIN users b ON a.scanned_by = b.user_id
    ORDER BY a.scan_datetime DESC
    `
  );
  return rows;
};
export const getAllScansFiltered = async (params: {
  page?: number;
  limit?: number;
  tracking_id?: string;
  from_date?: string;
  to_date?: string;
}) => {
  const { page = 1, limit = 10, tracking_id, from_date, to_date } = params;

  const offset = (page - 1) * limit;

  const values: any[] = [];
  let whereClause = `WHERE 1=1`;

  if (tracking_id) {
    values.push(`%${tracking_id.toLowerCase()}%`);
    whereClause += ` AND lower(a.tracking_id) LIKE $${values.length}`;
  }

  if (from_date) {
    values.push(from_date);
    whereClause += ` AND Date(a.scan_datetime) >= $${values.length}`;
  }

  if (to_date) {
    values.push(to_date);
    whereClause += ` AND Date(a.scan_datetime) <= $${values.length}`;
  }

  // pagination params
  values.push(limit);
  values.push(offset);

  const dataQuery = `
    SELECT b.full_name, a.*
    FROM scan_logs a
    LEFT JOIN users b ON a.scanned_by = b.user_id
    ${whereClause}
    ORDER BY a.scan_datetime DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM scan_logs a
    ${whereClause}
  `;

  const [{ rows }, countResult] = await Promise.all([
    db.query(dataQuery, values),
    db.query(countQuery, values.slice(0, values.length - 2)),
  ]);

  return {
    data: rows,
    count: Number(countResult.rows[0].total),
    page,
    limit,
  };
};

type ScanPoint = {
  latitude: number;
  longitude: number;
  scan_status: string;
  scan_datetime: string;
  centre_name: string;
  tracking_id: string;
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
          tracking_id: "",
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
      tracking_id: row.tracking_id,
    });
  }

  return Array.from(journeyMap.values());
};
