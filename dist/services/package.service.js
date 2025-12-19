"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageByTracking = exports.createInnerPackage = exports.createOuterPackage = void 0;
const db_1 = __importDefault(require("../config/db"));
const createOuterPackage = async (data, userId) => {
    const query = `
    INSERT INTO outer_packages
      (tracking_id, destination_centre_id, encrypted_qr_payload, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
    const values = [
        data.tracking_id,
        data.destination_centre_id,
        data.encrypted_qr_payload,
        userId,
    ];
    const { rows } = await db_1.default.query(query, values);
    return rows[0];
};
exports.createOuterPackage = createOuterPackage;
const createInnerPackage = async (data, userId) => {
    const query = `
    INSERT INTO inner_packages
      (tracking_id, outer_package_id, centre_id, exam_date, encrypted_qr_payload, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
    const values = [
        data.tracking_id,
        data.outer_package_id,
        data.centre_id,
        data.exam_date,
        data.encrypted_qr_payload,
        userId,
    ];
    const { rows } = await db_1.default.query(query, values);
    return rows[0];
};
exports.createInnerPackage = createInnerPackage;
const getPackageByTracking = async (trackingId) => {
    const outer = await db_1.default.query(`SELECT * FROM outer_packages WHERE tracking_id = $1`, [trackingId]);
    const inner = await db_1.default.query(`SELECT * FROM inner_packages WHERE tracking_id = $1`, [trackingId]);
    return {
        outer: outer.rows[0] || null,
        inner: inner.rows[0] || null,
    };
};
exports.getPackageByTracking = getPackageByTracking;
