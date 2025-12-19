import db from "../config/db";

interface AuditInput {
  event_type: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  description?: string;
  performed_by?: number;
  role_id?: number;
  ip_address?: string;
  user_agent?: string;
  request_payload?: any;
}

export const logAudit = async (data: AuditInput) => {
  await db.query(
    `INSERT INTO audit_logs
     (event_type, entity_type, entity_id, action, description,
      performed_by, role_id, ip_address, user_agent, request_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      data.event_type,
      data.entity_type,
      data.entity_id || null,
      data.action,
      data.description || null,
      data.performed_by || null,
      data.role_id || null,
      data.ip_address || null,
      data.user_agent || null,
      data.request_payload || null,
    ]
  );
};
