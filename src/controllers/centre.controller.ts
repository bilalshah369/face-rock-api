import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as service from "../services/centre.service";

export const create = async (req: AuthRequest, res: Response) => {
  const centre = await service.createCentre(req.body, req.user.user_id);
  res.json({ success: true, data: centre });
};

export const list = async (req: AuthRequest, res: Response) => {
  const centres = await service.getCentres(
    req.query.city_id ? Number(req.query.city_id) : undefined
  );
  res.json({ success: true, data: centres });
};
