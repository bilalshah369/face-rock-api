import db from "../config/db";

export const createState = async (data: any, userId: number) => {
  const { rows } = await db.query(
    `INSERT INTO states (state_name, state_code, created_by)
     VALUES ($1,$2,$3) RETURNING *`,
    [data.state_name, data.state_code, userId]
  );
  return rows[0];
};

export const getStates = async () => {
  const { rows } = await db.query(`SELECT * FROM states ORDER BY state_name`);
  return rows;
};
