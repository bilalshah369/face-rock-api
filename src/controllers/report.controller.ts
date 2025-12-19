import { Request, Response } from "express";
import * as service from "../services/report.service";

export const overall = async (_req: Request, res: Response) => {
  const data = await service.overallSummary();
  res.json({ success: true, data });
};

export const centreWise = async (_req: Request, res: Response) => {
  const data = await service.packagesByCentre();
  res.json({ success: true, data });
};

export const scanStats = async (_req: Request, res: Response) => {
  const data = await service.scanActivity();
  res.json({ success: true, data });
};

export const userScans = async (_req: Request, res: Response) => {
  const data = await service.userScanActivity();
  res.json({ success: true, data });
};

export const alerts = async (_req: Request, res: Response) => {
  const data = await service.alertsSummary();
  res.json({ success: true, data });
};
