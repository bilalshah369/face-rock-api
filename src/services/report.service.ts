import db from "../config/db";

export const overallSummary = async () => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) AS total_packages,
      COUNT(*) FILTER (WHERE status = 'DISPATCHED') AS dispatched,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
      COUNT(*) FILTER (WHERE status = 'RETURNED') AS returned,
      COUNT(*) FILTER (WHERE status = 'CREATED') AS pending
    FROM outer_packages
  `);

  return rows[0];
};

export const packagesByCentre = async () => {
  const { rows } = await db.query(`
    SELECT
      c.centre_name,
      COUNT(o.outer_package_id) AS total_packages,
      COUNT(*) FILTER (WHERE o.status = 'DELIVERED') AS delivered,
      COUNT(*) FILTER (WHERE o.status != 'DELIVERED') AS pending
    FROM outer_packages o
    JOIN centres c ON c.centre_id = o.destination_centre_id
    GROUP BY c.centre_name
    ORDER BY c.centre_name
  `);

  return rows;
};

export const scanActivity = async () => {
  const { rows } = await db.query(`
    SELECT
      DATE(scan_datetime) AS scan_date,
      COUNT(*) AS total_scans,
      COUNT(*) FILTER (WHERE scan_mode = 'OFFLINE') AS offline_scans,
      COUNT(*) FILTER (WHERE scan_mode = 'ONLINE') AS online_scans
    FROM scan_logs
    GROUP BY DATE(scan_datetime)
    ORDER BY scan_date DESC
  `);

  return rows;
};

export const userScanActivity = async () => {
  const { rows } = await db.query(`
    SELECT
      u.username,
      COUNT(s.scan_id) AS scans
    FROM scan_logs s
    JOIN users u ON u.user_id = s.scanned_by
    GROUP BY u.username
    ORDER BY scans DESC
  `);

  return rows;
};

export const alertsSummary = async () => {
  const { rows } = await db.query(`
    SELECT
      alert_type,
      COUNT(*) AS total
    FROM alerts
    GROUP BY alert_type
  `);

  return rows;
};
