import { Request, Response, NextFunction } from "express";
import { loginUser, loginRole } from "../services/auth.service";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser({ username, password });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};
export const loginWithRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.body;
    const result = await loginRole({ role });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};
