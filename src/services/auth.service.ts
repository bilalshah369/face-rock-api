import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import db from "../config/db";

interface LoginPayload {
  username?: string;
  password?: string;
  role?: string;
}
const trackLogin = async ({
  user_id,
  role_id,
  login_type,
  ip_address,
  user_agent,
}: {
  user_id: number;
  role_id: number;
  login_type: "USERNAME" | "ROLE";
  ip_address?: string;
  user_agent?: string;
}) => {
  const query = `
    INSERT INTO login_audit (
      user_id, role_id, login_type, ip_address, user_agent
    )
    VALUES ($1, $2, $3, $4, $5)
  `;

  await db.query(query, [
    user_id,
    role_id,
    login_type,
    ip_address ?? null,
    user_agent ?? null,
  ]);
};

export const loginUser = async ({ username, password }: LoginPayload) => {
  const query = `
    select a.user_id,a.username,a.full_name,a.phone_number,a.role_id,a.centre_id,a.created_on ,b.role_name
    FROM users a inner join  roles b on a.role_id=b.role_id
    WHERE a.username = $1 AND a.is_active = true and a.password=$2  order by a.created_on desc limit 1
  `;

  const { rows } = await db.query(query, [username, password]);
  if (rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = rows[0];
  await trackLogin({
    user_id: user.user_id,
    role_id: user.role_id,
    login_type: "USERNAME",
    ip_address: "",
    user_agent: "",
  });
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
    user: user,
  };
};

export const loginRole = async ({ role }: LoginPayload) => {
  const query = `
SELECT a.user_id,a.username,a.full_name,a.phone_number,a.role_id,a.centre_id,a.created_on ,b.role_name
    FROM users a inner join  roles b on a.role_id=b.role_id
    WHERE a.role_id = $1 AND a.is_active = true  order by a.created_on desc limit 1
  `;

  const { rows } = await db.query(query, [role]);
  if (rows.length === 0) {
    throw new Error("Invalid role");
  }

  const user = rows[0];
  await trackLogin({
    user_id: user.user_id,
    role_id: user.role_id,
    login_type: "ROLE",
    ip_address: "",
    user_agent: "",
  });
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
    user: user,
  };
};
