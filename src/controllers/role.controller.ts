import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as service from "../services/role.service";

export const create = async (req: AuthRequest, res: Response) => {
  const role = await service.createRole(req.body, req.user.user_id);
  res.json({ success: true, data: role });
};

export const list = async (_req: AuthRequest, res: Response) => {
  const roles = await service.getRoles();
  res.json({ success: true, data: roles });
};

export const getById = async (req: AuthRequest, res: Response) => {
  const role = await service.getRoleById(Number(req.params.id));
  res.json({ success: true, data: role });
};

export const update = async (req: AuthRequest, res: Response) => {
  const role = await service.updateRole(
    Number(req.params.id),
    req.body,
    req.user.user_id
  );
  res.json({ success: true, data: role });
};
