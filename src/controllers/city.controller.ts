import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as service from "../services/city.service";

export const create = async (req: AuthRequest, res: Response) => {
  const city = await service.createCity(req.body, req.user.user_id);
  res.json({ success: true, data: city });
};

export const list = async (req: AuthRequest, res: Response) => {
  const cities = await service.getCities(
    req.query.state_id ? Number(req.query.state_id) : undefined
  );
  res.json({ success: true, data: cities });
};
