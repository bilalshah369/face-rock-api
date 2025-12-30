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

      if (routeResult.rowCount < 2) {
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
  scan.status = "PENDING";
  const { centre_id, latitude, longitude } = scan;
  if (!centre_id || !latitude || !longitude) {
    scan.status = "INVALID_LOCATION";
  } else {
    /* Fetch route */
    const routeResult = await db.query(
      `SELECT latitude, longitude
           FROM centre_package_route_points
           WHERE centre_id = $1
           ORDER BY sequence_no ASC`,
      [centre_id]
    );

    if (routeResult.rowCount < 2) {
      scan.status = "NO_ROUTE";
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

      scan.status = isValid ? "ON_ROUTE" : "OFF_ROUTE";
    }
  }
  const result = await service.saveScan(scan, req.user.user_id);
  res.json({ success: true, data: result });
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
