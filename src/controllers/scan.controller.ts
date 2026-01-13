import { Request, Response } from "express";
import db from "../config/db";
import * as service from "../services/scan.service";
import { validateScanOnRoute } from "../utils/routeValidator";
export const syncScans = async (req: Request, res: Response) => {
  const scans = req.body.scans;

  if (!Array.isArray(scans)) {
    return res.status(400).json({ message: "Invalid scans payload" });
  }

  const results = [];

  for (const scan of scans) {
    scan.scan_status = "PENDING";
    const { centre_id, latitude, longitude } = scan;
    if (!centre_id || !latitude || !longitude) {
      scan.scan_status = "INVALID_LOCATION";
    } else {
      /* Fetch route */
      const routeResult = await db.query(
        `SELECT latitude, longitude
           FROM centre_package_route_points
           WHERE centre_id = $1
           ORDER BY sequence_no ASC`,
        [centre_id]
      );

      if (routeResult.rowCount === 0) {
        scan.scan_status = "NO_ROUTE";
      } else {
        /* 🔹 Convert DB rows to route array */
        const route = routeResult.rows.map((r) => ({
          lat: Number(r.latitude),
          lng: Number(r.longitude),
        }));

        const isValid = validateScanOnRoute(
          route,
          Number(latitude),
          Number(longitude),
          10
        );

        scan.scan_status = isValid ? "ON_ROUTE" : "OFF_ROUTE";
      }
    }
    const result = await service.saveScan(scan, req.user.user_id);
    results.push({
      tracking_id: scan.tracking_id,
      scan_id: result.scan_id,
      status: "SYNCED",
    });
  }

  res.json({
    success: true,
    synced: results.length,
    results,
  });
};

export const singleScan = async (req: Request, res: Response) => {
  let scan = req.body;
  scan.scan_status = "PENDING";
  const { centre_id, latitude, longitude } = scan;
  if (!centre_id || !latitude || !longitude) {
    scan.scan_status = "INVALID_LOCATION";
  } else {
    /* Fetch route */
    const routeResult = await db.query(
      `SELECT latitude, longitude
           FROM centre_package_route_points
           WHERE centre_id = $1
           ORDER BY sequence_no ASC`,
      [centre_id]
    );

    if (routeResult.rowCount === 0) {
      scan.scan_status = "NO_ROUTE";
    } else {
      /* 🔹 Convert DB rows to route array */
      const route = routeResult.rows.map((r) => ({
        lat: Number(r.latitude),
        lng: Number(r.longitude),
      }));

      const isValid = validateScanOnRoute(
        route,
        Number(latitude),
        Number(longitude),
        10000
      );

      scan.scan_status = isValid ? "ON_ROUTE" : "OFF_ROUTE";
    }
  }
  const result = await service.saveScan(scan, req.user.user_id);
  res.json({ success: true, data: result });
};
export const singleScanManual = async (req: Request, res: Response) => {
  const scan = req.body;
  scan.scan_status = "PENDING";

  const { tracking_id, latitude, longitude } = scan;

  if (!tracking_id || !latitude || !longitude) {
    scan.scan_status = "INVALID_LOCATION";
  } else {
    /* ================= GET CENTRE ID ================= */
    const normalizedTrackingId = String(tracking_id).trim().toUpperCase();

    const centreResult = await db.query(
      `
  SELECT centre_id, qr_type
  FROM vw_all_packages_qr
  WHERE UPPER(tracking_id) = $1
  LIMIT 1
  `,
      [normalizedTrackingId]
    );

    if (centreResult.rowCount === 0) {
      scan.scan_status = "INVALID_TRACKING_ID";
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        data: {},
      });
    } else {
      const centre_id = centreResult.rows[0].centre_id;
      scan.centre_id = centre_id;

      /* ================= GET ROUTE ================= */
      const routeResult = await db.query(
        `
        SELECT latitude, longitude
        FROM centre_package_route_points
        WHERE centre_id = $1
        ORDER BY sequence_no ASC
        `,
        [centre_id]
      );

      if (routeResult.rowCount === 0) {
        scan.scan_status = "NO_ROUTE";
      } else {
        const route = routeResult.rows.map((r) => ({
          lat: Number(r.latitude),
          lng: Number(r.longitude),
        }));

        const isValid = validateScanOnRoute(
          route,
          Number(latitude),
          Number(longitude),
          10000 // meters tolerance
        );

        scan.scan_status = isValid ? "ON_ROUTE" : "OFF_ROUTE";
      }
    }
  }

  const result = await service.saveScan(scan, req.user.user_id);
  return res.json({ success: true, data: result });
};

export const getAllScans = async (req: Request, res: Response) => {
  try {
    const result = await service.getAllScansFiltered({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      tracking_id: req.query.tracking_id as string,
      from_date: req.query.from_date as string,
      to_date: req.query.to_date as string,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getScans = async (req: Request, res: Response) => {
  const scans = await service.getScanHistory(req.params.trackingId);
  res.json({ success: true, data: scans });
};
export const getJourney = async (req: Request, res: Response) => {
  const trackingId = req.query.trackingId as string | undefined;
  const scans = await service.getScanJourney(trackingId);
  res.json({ success: true, data: scans });
};

export const recalculateRouteStatus = async (req: Request, res: Response) => {
  const { centre_id, distance_meters } = req.body;

  if (!centre_id || !distance_meters) {
    return res.status(400).json({
      success: false,
      message: "centre_id and distance_meters are required",
    });
  }

  /* ===== Fetch Route ===== */
  const routeResult = await db.query(
    `
    SELECT latitude, longitude
    FROM centre_package_route_points
    WHERE centre_id = $1
    ORDER BY sequence_no ASC
    `,
    [centre_id]
  );

  if (routeResult.rowCount === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid route found for centre",
    });
  }

  const route = routeResult.rows.map((r) => ({
    lat: Number(r.latitude),
    lng: Number(r.longitude),
  }));

  /* ===== Fetch Saved Scans ===== */
  const scansResult = await db.query(
    `
    SELECT scan_id, latitude, longitude
    FROM scan_logs
    WHERE centre_id = $1
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    `,
    [centre_id]
  );

  let onRoute = 0;
  let offRoute = 0;

  /* ===== Recalculate ===== */
  for (const scan of scansResult.rows) {
    const isValid = validateScanOnRoute(
      route,
      Number(scan.latitude),
      Number(scan.longitude),
      Number(distance_meters)
    );

    const newStatus = isValid ? "ON_ROUTE" : "OFF_ROUTE";

    // await db.query(
    //   `
    //   UPDATE scan_logs
    //   SET scan_status = $1,
    //       route_distance_used = $2,
    //       recalculated_at = NOW(),
    //       recalculated_by = $3
    //   WHERE scan_id = $4
    //   `,
    //   [newStatus, distance_meters, req.user.user_id, scan.scan_id]
    // );

    isValid ? onRoute++ : offRoute++;
  }

  /* ===== Summary Only ===== */
  return res.json({
    success: true,
    centre_id,
    distance_used_meters: distance_meters,
    summary: {
      total_scans_processed: scansResult.rowCount,
      on_route: onRoute,
      off_route: offRoute,
    },
  });
};

export const previewRouteCheck = async (req: Request, res: Response) => {
  const { centre_id, distance_meters } = req.body;

  if (!distance_meters) {
    return res.status(400).json({
      success: false,
      message: "distance_meters is required",
    });
  }

  /* ===== Fetch Centres ===== */
  const centresResult = centre_id
    ? await db.query(
        ` SELECT DISTINCT s.centre_id, c.centre_name
      FROM scan_logs s
      JOIN centres c ON c.centre_id = s.centre_id
      WHERE s.centre_id = $1`,
        [centre_id]
      )
    : await db.query(`SELECT DISTINCT s.centre_id, c.centre_name
      FROM scan_logs s
      JOIN centres c ON c.centre_id = s.centre_id`);

  if (centresResult.rowCount === 0) {
    return res.status(400).json({
      success: false,
      message: "No centres found",
    });
  }

  const result: any = {};
  let totalScans = 0;
  let totalOnRoute = 0;
  let totalOffRoute = 0;
  /* ===== Process Each Centre ===== */
  for (const c of centresResult.rows) {
    const currentCentreId = c.centre_id;

    /* --- Fetch Route --- */
    const routeResult = await db.query(
      `
      SELECT latitude, longitude
      FROM centre_package_route_points
      WHERE centre_id = $1
      ORDER BY sequence_no ASC
      `,
      [currentCentreId]
    );

    if (routeResult.rowCount < 2) continue;

    const route = routeResult.rows.map((r) => ({
      lat: Number(r.latitude),
      lng: Number(r.longitude),
    }));

    /* --- Fetch Scans --- */
    const scansResult = await db.query(
      `
      SELECT latitude, longitude
      FROM scan_logs
      WHERE centre_id = $1
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      `,
      [currentCentreId]
    );

    if (scansResult.rowCount === 0) continue;

    let onRoute = 0;
    let offRoute = 0;

    /* --- Validate --- */
    for (const scan of scansResult.rows) {
      const isValid = validateScanOnRoute(
        route,
        Number(scan.latitude),
        Number(scan.longitude),
        Number(distance_meters)
      );

      isValid ? onRoute++ : offRoute++;
    }

    result[currentCentreId] = {
      centre_name: c.centre_name,
      total: scansResult.rowCount,
      on_route: onRoute,
      off_route: offRoute,
    };
    totalScans += scansResult.rowCount;
    totalOnRoute += onRoute;
    totalOffRoute += offRoute;
  }

  return res.json({
    success: true,
    preview_only: true,
    distance_used_meters: distance_meters,
    centres_processed: Object.keys(result).length,
    total_summary: {
      total_scans: totalScans,
      on_route: totalOnRoute,
      off_route: totalOffRoute,
    },
    result,
  });
};

export const previewGeographicBoundary = async (
  req: Request,
  res: Response
) => {
  try {
    const { centre_id, distance_meters } = req.body;

    const { tracking_id, from_date, to_date } = req.query as {
      tracking_id?: string;
      from_date?: string;
      to_date?: string;
    };

    if (!distance_meters) {
      return res.status(400).json({
        success: false,
        message: "distance_meters is required",
      });
    }

    /* ===============================
       BUILD COMMON FILTERS
    =============================== */
    const filters: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (centre_id) {
      filters.push(`s.centre_id = $${idx++}`);
      values.push(centre_id);
    }

    if (tracking_id) {
      filters.push(`s.tracking_id ILIKE $${idx++}`);
      values.push(`%${tracking_id}%`);
    }
    if (from_date) {
      filters.push(`DATE(s.scan_datetime) >= $${idx++}`);
      values.push(from_date);
    }

    if (to_date) {
      filters.push(`DATE(s.scan_datetime) <= $${idx++}`);
      values.push(to_date);
    }
    // if (from_date) {
    //   filters.push(`s.scan_datetime >= $${idx++}`);
    //   values.push(from_date);
    // }

    // if (to_date) {
    //   filters.push(`s.scan_datetime <= $${idx++}`);
    //   values.push(to_date);
    // }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    /* ===============================
       FETCH CENTRES (FILTERED)
    =============================== */
    const centresResult = await db.query(
      `
      SELECT DISTINCT s.centre_id, c.centre_name
      FROM scan_logs s
      JOIN centres c ON c.centre_id = s.centre_id
      ${whereClause}
      `,
      values
    );

    if (centresResult.rowCount === 0) {
      return res.json({
        success: true,
        preview_only: true,
        centres_processed: 0,
        total_summary: {
          total_scans: 0,
          on_route: 0,
          off_route: 0,
        },
        result: {},
      });
    }

    /* ===============================
       PROCESS EACH CENTRE
    =============================== */
    const result: any = {};
    let totalScans = 0;
    let totalOnRoute = 0;
    let totalOffRoute = 0;

    for (const centre of centresResult.rows) {
      const currentCentreId = centre.centre_id;

      /* --- FETCH ROUTE POINTS --- */
      const routeResult = await db.query(
        `
        SELECT latitude, longitude
        FROM centre_package_route_points
        WHERE centre_id = $1
        ORDER BY sequence_no ASC
        `,
        [currentCentreId]
      );

      //if (routeResult.rowCount < 1) continue;

      const route = routeResult.rows.map((r) => ({
        lat: Number(r.latitude),
        lng: Number(r.longitude),
      }));

      /* --- FETCH FILTERED SCANS --- */
      const scanFilters: string[] = [
        `s.centre_id = $1`,
        `s.latitude IS NOT NULL`,
        `s.longitude IS NOT NULL`,
      ];

      const scanValues: any[] = [currentCentreId];
      let scanIdx = 2;

      if (tracking_id) {
        scanFilters.push(`s.tracking_id ILIKE $${scanIdx++}`);
        scanValues.push(`%${tracking_id}%`);
      }

      // if (from_date) {
      //   scanFilters.push(`s.scan_datetime >= $${scanIdx++}`);
      //   scanValues.push(from_date);
      // }

      // if (to_date) {
      //   scanFilters.push(`s.scan_datetime <= $${scanIdx++}`);
      //   scanValues.push(to_date);
      // }
      if (from_date) {
        scanFilters.push(`DATE(s.scan_datetime) >= $${scanIdx++}`);
        scanValues.push(from_date);
      }

      if (to_date) {
        scanFilters.push(`DATE(s.scan_datetime) <= $${scanIdx++}`);
        scanValues.push(to_date);
      }
      const scansResult = await db.query(
        `
        SELECT latitude, longitude
        FROM scan_logs s
        WHERE ${scanFilters.join(" AND ")}
        `,
        scanValues
      );

      if (scansResult.rowCount === 0) continue;

      /* --- VALIDATE ROUTE --- */
      let onRoute = 0;
      let offRoute = 0;

      for (const scan of scansResult.rows) {
        const isValid = validateScanOnRoute(
          route,
          Number(scan.latitude),
          Number(scan.longitude),
          Number(distance_meters)
        );

        isValid ? onRoute++ : offRoute++;
      }

      result[currentCentreId] = {
        centre_name: centre.centre_name,
        total: scansResult.rowCount,
        on_route: onRoute,
        off_route: offRoute,
      };

      totalScans += scansResult.rowCount;
      totalOnRoute += onRoute;
      totalOffRoute += offRoute;
    }

    /* ===============================
       RESPONSE
    =============================== */
    return res.json({
      success: true,
      preview_only: true,
      distance_used_meters: distance_meters,
      centres_processed: Object.keys(result).length,
      total_summary: {
        total_scans: totalScans,
        on_route: totalOnRoute,
        off_route: totalOffRoute,
      },
      result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
