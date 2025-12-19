import db from "../config/db";
import bcrypt from "bcrypt";

export const createUser = async (data: any, createdBy: number) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const { rows } = await db.query(
    `INSERT INTO users
     (username, full_name, phone_number, password, role_id, centre_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING user_id, username, full_name, role_id, centre_id, is_active`,
    [
      data.username,
      data.full_name,
      data.phone_number,
      hashedPassword,
      data.role_id,
      data.centre_id || null,
      createdBy,
    ]
  );

  return rows[0];
};

export const getUsers = async () => {
  const { rows } = await db.query(
    `SELECT a.user_id, a.username, a.full_name, a.phone_number, a.role_id,
            a.centre_id, a.is_active,b.role_name
     FROM users a left join public.roles b on a.role_id=b.role_id
     ORDER BY user_id`
  );
  return rows;
};

export const getUserById = async (id: number) => {
  const { rows } = await db.query(
    `SELECT user_id, username, full_name, phone_number,
            role_id, centre_id, is_active
     FROM users
     WHERE user_id = $1`,
    [id]
  );
  return rows[0];
};

export const updateUser = async (id: number, data: any, updatedBy: number) => {
  const { rows } = await db.query(
    `UPDATE users
     SET full_name=$1,
         phone_number=$2,
         role_id=$3,
         centre_id=$4,
         updated_on=NOW(),
         updated_by=$5
     WHERE user_id=$6
     RETURNING user_id, username, full_name, role_id, centre_id`,
    [
      data.full_name,
      data.phone_number,
      data.role_id,
      data.centre_id || null,
      updatedBy,
      id,
    ]
  );
  return rows[0];
};

export const toggleUserStatus = async (
  id: number,
  isActive: boolean,
  updatedBy: number
) => {
  const { rows } = await db.query(
    `UPDATE users
     SET is_active=$1,
         updated_on=NOW(),
         updated_by=$2
     WHERE user_id=$3
     RETURNING user_id, username, is_active`,
    [isActive, updatedBy, id]
  );
  return rows[0];
};

export const resetPassword = async (
  id: number,
  password: string,
  updatedBy: number
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    `UPDATE users
     SET password=$1,
         updated_on=NOW(),
         updated_by=$2
     WHERE user_id=$3`,
    [hashedPassword, updatedBy, id]
  );
};
