import { Request, Response } from "express";
import * as service from "../services/centre.service";

export const create = async (req: Request, res: Response) => {
  const centre = await service.createCentre(req.body, req.user.user_id);
  res.json({ success: true, data: centre });
};

export const list = async (req: Request, res: Response) => {
  const centres = await service.getCentres(
    req.query.city_id ? Number(req.query.city_id) : undefined
  );
  res.json({ success: true, data: centres });
};
