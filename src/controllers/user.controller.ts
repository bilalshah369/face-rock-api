import { Request, Response } from "express";

import * as service from "../services/user.service";

export const create = async (req: Request, res: Response) => {
  const user = await service.createUser(req.body, req.user.user_id);
  res.json({ success: true, data: user });
};

export const list = async (_req: Request, res: Response) => {
  const users = await service.getUsers();
  res.json({ success: true, data: users });
};

export const getById = async (req: Request, res: Response) => {
  const user = await service.getUserById(Number(req.params.id));
  res.json({ success: true, data: user });
};

export const update = async (req: Request, res: Response) => {
  const user = await service.updateUser(
    Number(req.params.id),
    req.body,
    req.user.user_id
  );
  res.json({ success: true, data: user });
};

export const activate = async (req: Request, res: Response) => {
  const user = await service.toggleUserStatus(
    Number(req.params.id),
    true,
    req.user.user_id
  );
  res.json({ success: true, data: user });
};

export const deactivate = async (req: Request, res: Response) => {
  const user = await service.toggleUserStatus(
    Number(req.params.id),
    false,
    req.user.user_id
  );
  res.json({ success: true, data: user });
};

export const resetPwd = async (req: Request, res: Response) => {
  await service.resetPassword(
    Number(req.params.id),
    req.body.password,
    req.user.user_id
  );
  res.json({ success: true, message: "Password reset successfully" });
};
