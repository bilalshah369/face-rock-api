import { Request, Response } from "express";
import db from "../config/db";

export const list = async (req: Request, res: Response) => {
  debugger;
  const { event_type, entity_type, from, to } = req.query;

  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params: any[] = [];

  if (event_type) {
    params.push(event_type);
    query += ` AND event_type=$${params.length}`;
  }

  if (entity_type) {
    params.push(entity_type);
    query += ` AND entity_type=$${params.length}`;
  }

  if (from && to) {
    params.push(from, to);
    query += ` AND created_on BETWEEN $${params.length - 1} AND $${
      params.length
    }`;
  }

  query += ` ORDER BY created_on DESC`;

  const { rows } = await db.query(query, params);
  res.json({ success: true, data: rows });
};
