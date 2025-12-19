import { Request, Response, NextFunction } from "express";

import { logAudit } from "../services/audit.service";

export const auditMiddleware = (eventType: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        await logAudit({
          event_type: eventType,
          entity_type: entityType,
          entity_id: req.params?.id,
          action: req.method,
          performed_by: req.user?.user_id,
          role_id: req.user?.role_id,
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          request_payload: req.body,
        });
      }
    });

    next();
  };
};
