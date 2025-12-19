"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCentres = exports.createCentre = void 0;
const db_1 = __importDefault(require("../config/db"));
const createCentre = async (data, userId) => {
    const { rows } = await db_1.default.query(`INSERT INTO centres
     (centre_code, centre_name, city_id, latitude, longitude, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`, [
        data.centre_code,
        data.centre_name,
        data.city_id,
        data.latitude,
        data.longitude,
        userId,
    ]);
    return rows[0];
};
exports.createCentre = createCentre;
const getCentres = async (cityId) => {
    const query = cityId
        ? `SELECT * FROM centres WHERE city_id=$1 AND is_active=true`
        : `SELECT * FROM centres WHERE is_active=true`;
    const { rows } = await db_1.default.query(query, cityId ? [cityId] : []);
    return rows;
};
exports.getCentres = getCentres;
