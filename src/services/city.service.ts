import db from "../config/db";

export const createCity = async (data: any, userId: number) => {
  const { rows } = await db.query(
    `INSERT INTO cities (state_id, city_name, created_by)
     VALUES ($1,$2,$3) RETURNING *`,
    [data.state_id, data.city_name, userId]
  );
  return rows[0];
};

export const getCities = async (stateId?: number) => {
  const query = stateId
    ? `SELECT * FROM cities WHERE state_id=$1 ORDER BY city_name`
    : `SELECT * FROM cities ORDER BY city_name`;

  const { rows } = await db.query(query, stateId ? [stateId] : []);
  return rows;
};
