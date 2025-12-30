import { Request, Response } from "express";
import * as service from "../services/centre.service";
import db from "../config/db";
export const create = async (req: Request, res: Response) => {
  const centre = await service.createCentre(req.body, req.user.user_id);
  res.json({ success: true, data: centre });
};

export const list = async (req: Request, res: Response) => {
  const centres = await service.getCentres(
    req.query.city_id ? Number(req.query.city_id) : undefined
  );
  res.json({ success: true, data: centres });
};
export const saveCentrePackageRoute = async (req, res) => {
  const client = await db.connect();
  const { centre_id, route_points } = req.body;
  const userId = req.user_id;

  if (!route_points || route_points.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Minimum two coordinates required",
    });
  }

  try {
    await client.query("BEGIN");

    // Delete existing route points for centre
    await client.query(
      `DELETE FROM centre_package_route_points WHERE centre_id = $1`,
      [centre_id]
    );

    // Insert new route points
    for (let i = 0; i < route_points.length; i++) {
      const p = route_points[i];
      await client.query(
        `
        INSERT INTO centre_package_route_points
          (centre_id, sequence_no, latitude, longitude, created_by)
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [centre_id, i + 1, p.latitude, p.longitude, userId]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const getCentrePackageRoute = async (req, res) => {
  const { centre_id } = req.params;

  const result = await db.query(
    `
    SELECT latitude, longitude
    FROM centre_package_route_points
    WHERE centre_id = $1
    ORDER BY sequence_no
    `,
    [centre_id]
  );

  res.json({
    success: true,
    data: result.rows,
  });
};
