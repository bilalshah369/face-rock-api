"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRole = exports.getRoleById = exports.getRoles = exports.createRole = void 0;
const db_1 = __importDefault(require("../config/db"));
const createRole = async (data, userId) => {
    const { rows } = await db_1.default.query(`INSERT INTO roles (role_name, description, created_by)
     VALUES ($1,$2,$3)
     RETURNING *`, [data.role_name, data.description || null, userId]);
    return rows[0];
};
exports.createRole = createRole;
const getRoles = async () => {
    const { rows } = await db_1.default.query(`SELECT role_id, role_name, description
     FROM roles
     ORDER BY role_id`);
    return rows;
};
exports.getRoles = getRoles;
const getRoleById = async (id) => {
    const { rows } = await db_1.default.query(`SELECT role_id, role_name, description
     FROM roles
     WHERE role_id = $1`, [id]);
    return rows[0];
};
exports.getRoleById = getRoleById;
const updateRole = async (id, data, userId) => {
    const { rows } = await db_1.default.query(`UPDATE roles
     SET role_name=$1,
         description=$2,
         updated_on=NOW(),
         updated_by=$3
     WHERE role_id=$4
     RETURNING *`, [data.role_name, data.description, userId, id]);
    return rows[0];
};
exports.updateRole = updateRole;
