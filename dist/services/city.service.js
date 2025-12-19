"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCities = exports.createCity = void 0;
const db_1 = __importDefault(require("../config/db"));
const createCity = async (data, userId) => {
    const { rows } = await db_1.default.query(`INSERT INTO cities (state_id, city_name, created_by)
     VALUES ($1,$2,$3) RETURNING *`, [data.state_id, data.city_name, userId]);
    return rows[0];
};
exports.createCity = createCity;
const getCities = async (stateId) => {
    const query = stateId
        ? `SELECT * FROM cities WHERE state_id=$1 ORDER BY city_name`
        : `SELECT * FROM cities ORDER BY city_name`;
    const { rows } = await db_1.default.query(query, stateId ? [stateId] : []);
    return rows;
};
exports.getCities = getCities;
