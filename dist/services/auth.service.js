"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const loginUser = async ({ username, password }) => {
    const query = `
    SELECT user_id, username, password, role_id
    FROM users
    WHERE username = $1 AND is_active = true and password=$2
  `;
    const { rows } = await db_1.default.query(query, [username, password]);
    if (rows.length === 0) {
        throw new Error("Invalid username or password");
    }
    const user = rows[0];
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   throw new Error("Invalid username or password");
    // }
    // ✅ Explicit typing (this fixes TS error)
    const jwtSecret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? "8h";
    const token = jsonwebtoken_1.default.sign({
        user_id: user.user_id,
        role_id: user.role_id,
    }, jwtSecret, { expiresIn });
    return {
        token,
        user: {
            user_id: user.user_id,
            username: user.username,
            role_id: user.role_id,
        },
    };
};
exports.loginUser = loginUser;
