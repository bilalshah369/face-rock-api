import { Request, Response } from "express";
import * as service from "../services/package.service";

import db from "../config/db";
export const createOuter = async (req: Request, res: Response) => {
  const result = await service.createOuterPackage(req.body, req.user.user_id);
  res.json({ success: true, data: result });
};

export const createInner = async (req: Request, res: Response) => {
  const result = await service.createInnerPackage(req.body, req.user.user_id);
  res.json({ success: true, data: result });
};

export const getPackage = async (req: Request, res: Response) => {
  const result = await service.getPackageByTracking(req.params.trackingId);
  res.json({ success: true, data: result });
};
export const getInnerPackageByPackageId = async (
  req: Request,
  res: Response
) => {
  const result = await service.getInnerPackageByPackageId(
    req.params.outer_package_id
  );
  res.json({ success: true, data: result });
};

/**
 * Add package movement event
 */
export const addEvent = async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  const { event_type, latitude, longitude } = req.body;

  if (!event_type) {
    return res.status(400).json({ message: "event_type is required" });
  }

  const { rows } = await db.query(
    `INSERT INTO package_events
     (tracking_id, event_type, event_datetime, user_id, latitude, longitude, created_by)
     VALUES ($1, $2, NOW(), $3, $4, $5, $3)
     RETURNING *`,
    [
      trackingId,
      event_type,
      req.user.user_id,
      latitude || null,
      longitude || null,
    ]
  );

  res.json({ success: true, data: rows[0] });
};

/**
 * Get package movement history
 */
export const getEvents = async (req: Request, res: Response) => {
  const { trackingId } = req.params;

  const { rows } = await db.query(
    `SELECT event_type, event_datetime, latitude, longitude, user_id
     FROM package_events
     WHERE tracking_id = $1
     ORDER BY event_datetime ASC`,
    [trackingId]
  );

  res.json({ success: true, data: rows });
};

export const getAllPackages = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, tracking_id, status } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = "WHERE 1=1";
    const values: any[] = [];

    if (tracking_id) {
      values.push(`%${tracking_id}%`);
      whereClause += ` AND tracking_id ILIKE $${values.length}`;
    }

    if (status) {
      values.push(status);
      whereClause += ` AND status = $${values.length}`;
    }

    const query = `
      SELECT a.*,b.centre_code,b.centre_name
      FROM outer_packages a
      inner join public.centres b on a.destination_centre_id=b.centre_id
      ${whereClause}
      ORDER BY created_on DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    values.push(Number(limit), offset);

    const result = await db.query(query, values);

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
};
