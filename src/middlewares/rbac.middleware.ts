import { Request, Response, NextFunction } from "express";

export const allowRoles = (allowedRoles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role_id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const userRole = Number(req.user.role_id);

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
