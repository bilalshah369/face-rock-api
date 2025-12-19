import db from "../config/db";

export const createCentre = async (data: any, userId: number) => {
  const { rows } = await db.query(
    `INSERT INTO centres
     (centre_code, centre_name, city_id, latitude, longitude, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.centre_code,
      data.centre_name,
      data.city_id,
      data.latitude,
      data.longitude,
      userId,
    ]
  );
  return rows[0];
};

export const getCentres = async (cityId?: number) => {
  const query = cityId
    ? `SELECT * FROM centres WHERE city_id=$1 AND is_active=true`
    : `SELECT * FROM centres WHERE is_active=true`;

  const { rows } = await db.query(query, cityId ? [cityId] : []);
  return rows;
};
