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
    const { page = 1, limit = 200000, tracking_id, status } = req.query;

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
      SELECT a.*,b.centre_code,b.centre_name,a.tracking_id as outer_tracking_id
      FROM public.vw_all_packages a
      inner join public.centres b on a.centre_id=b.centre_id
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

export const getAllPackagesView = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      tracking_id,
      status,
      package_type,
      centre,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const values: any[] = [];
    let whereClause = "WHERE 1=1";

    if (tracking_id) {
      values.push(`%${tracking_id}%`);
      whereClause += ` AND tracking_id ILIKE $${values.length}`;
    }

    if (status) {
      values.push(status);
      whereClause += ` AND status = $${values.length}`;
    }

    if (package_type) {
      values.push(package_type);
      whereClause += ` AND package_type = $${values.length}`;
    }
    if (centre) {
      values.push(centre);
      whereClause += ` AND a.centre_id = $${values.length}`;
    }
    const total_query = `
      SELECT a.*,b.centre_code,b.centre_name
      FROM public.vw_all_packages  a
      inner join public.centres b on a.centre_id=b.centre_id
      ${whereClause}
      
    `;
    const query = `
      SELECT a.*,b.centre_code,b.centre_name
      FROM public.vw_all_packages  a
      inner join public.centres b on a.centre_id=b.centre_id
      ${whereClause}
      ORDER BY created_on DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    const result_total = await db.query(total_query, values);
    values.push(Number(limit), offset);

    const result = await db.query(query, values);

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      count: result_total.rowCount,
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

export const bulkUploadOuterPackages = async (req, res) => {
  try {
    const userId = req.user.user_id; // from auth middleware
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided",
      });
    }

    const result = await service.bulkCreateOuterPackages(rows, userId);

    res.json({
      success: true,
      message: "Chunk uploaded successfully",
      ...result,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const bulkUploadInnerPackages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided",
      });
    }

    const result = await service.bulkCreateInnerPackages(rows, userId);

    res.json({
      success: true,
      message: "Inner packages uploaded successfully",
      ...result,
    });
  } catch (error) {
    console.error("Inner bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
