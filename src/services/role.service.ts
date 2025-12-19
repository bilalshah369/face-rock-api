import db from "../config/db";

export const createRole = async (data: any, userId: number) => {
  const { rows } = await db.query(
    `INSERT INTO roles (role_name, description, created_by)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [data.role_name, data.description || null, userId]
  );
  return rows[0];
};

export const getRoles = async () => {
  const { rows } = await db.query(
    `SELECT role_id, role_name, description
     FROM roles
     ORDER BY role_id`
  );
  return rows;
};

export const getRoleById = async (id: number) => {
  const { rows } = await db.query(
    `SELECT role_id, role_name, description
     FROM roles
     WHERE role_id = $1`,
    [id]
  );
  return rows[0];
};

export const updateRole = async (id: number, data: any, userId: number) => {
  const { rows } = await db.query(
    `UPDATE roles
     SET role_name=$1,
         description=$2,
         updated_on=NOW(),
         updated_by=$3
     WHERE role_id=$4
     RETURNING *`,
    [data.role_name, data.description, userId, id]
  );
  return rows[0];
};
