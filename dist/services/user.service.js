"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.toggleUserStatus = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUser = async (data, createdBy) => {
    const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
    const { rows } = await db_1.default.query(`INSERT INTO users
     (username, full_name, phone_number, password, role_id, centre_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING user_id, username, full_name, role_id, centre_id, is_active`, [
        data.username,
        data.full_name,
        data.phone_number,
        hashedPassword,
        data.role_id,
        data.centre_id || null,
        createdBy,
    ]);
    return rows[0];
};
exports.createUser = createUser;
const getUsers = async () => {
    const { rows } = await db_1.default.query(`SELECT user_id, username, full_name, phone_number, role_id,
            centre_id, is_active
     FROM users
     ORDER BY user_id`);
    return rows;
};
exports.getUsers = getUsers;
const getUserById = async (id) => {
    const { rows } = await db_1.default.query(`SELECT user_id, username, full_name, phone_number,
            role_id, centre_id, is_active
     FROM users
     WHERE user_id = $1`, [id]);
    return rows[0];
};
exports.getUserById = getUserById;
const updateUser = async (id, data, updatedBy) => {
    const { rows } = await db_1.default.query(`UPDATE users
     SET full_name=$1,
         phone_number=$2,
         role_id=$3,
         centre_id=$4,
         updated_on=NOW(),
         updated_by=$5
     WHERE user_id=$6
     RETURNING user_id, username, full_name, role_id, centre_id`, [
        data.full_name,
        data.phone_number,
        data.role_id,
        data.centre_id || null,
        updatedBy,
        id,
    ]);
    return rows[0];
};
exports.updateUser = updateUser;
const toggleUserStatus = async (id, isActive, updatedBy) => {
    const { rows } = await db_1.default.query(`UPDATE users
     SET is_active=$1,
         updated_on=NOW(),
         updated_by=$2
     WHERE user_id=$3
     RETURNING user_id, username, is_active`, [isActive, updatedBy, id]);
    return rows[0];
};
exports.toggleUserStatus = toggleUserStatus;
const resetPassword = async (id, password, updatedBy) => {
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    await db_1.default.query(`UPDATE users
     SET password=$1,
         updated_on=NOW(),
         updated_by=$2
     WHERE user_id=$3`, [hashedPassword, updatedBy, id]);
};
exports.resetPassword = resetPassword;
