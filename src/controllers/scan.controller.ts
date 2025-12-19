import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as service from "../services/scan.service";

export const syncScans = async (req: AuthRequest, res: Response) => {
  const scans = req.body.scans;

  if (!Array.isArray(scans)) {
    return res.status(400).json({ message: "Invalid scans payload" });
  }

  const results = [];

  for (const scan of scans) {
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

export const singleScan = async (req: AuthRequest, res: Response) => {
  const result = await service.saveScan(req.body, req.user.user_id);
  res.json({ success: true, data: result });
};

export const getScans = async (req: AuthRequest, res: Response) => {
  const scans = await service.getScanHistory(req.params.trackingId);
  res.json({ success: true, data: scans });
};
