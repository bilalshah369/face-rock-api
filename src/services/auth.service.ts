import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import db from "../config/db";

interface LoginPayload {
  username: string;
  password: string;
}

export const loginUser = async ({ username, password }: LoginPayload) => {
  const query = `
    SELECT user_id, username, password, role_id
    FROM users
    WHERE username = $1 AND is_active = true and password=$2
  `;

  const { rows } = await db.query(query, [username, password]);
  if (rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = rows[0];

  // const isMatch = await bcrypt.compare(password, user.password);
  // if (!isMatch) {
  //   throw new Error("Invalid username or password");
  // }

  // ✅ Explicit typing (this fixes TS error)
  const jwtSecret: Secret = process.env.JWT_SECRET as Secret;

  const expiresIn: any = process.env.JWT_EXPIRES_IN ?? "8h";

  const token = jwt.sign(
    {
      user_id: user.user_id,
      role_id: user.role_id,
    },
    jwtSecret,
    { expiresIn }
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
    },
  };
};
