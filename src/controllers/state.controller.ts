import { Request, Response } from "express";

import * as service from "../services/state.service";

export const create = async (req: Request, res: Response) => {
  const state = await service.createState(req.body, req.user.user_id);
  res.json({ success: true, data: state });
};

export const list = async (_req: Request, res: Response) => {
  const states = await service.getStates();
  res.json({ success: true, data: states });
};
