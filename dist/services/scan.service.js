"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScanHistory = exports.saveScan = void 0;
const db_1 = __importDefault(require("../config/db"));
const saveScan = async (scan, userId) => {
    const scanQuery = `
    INSERT INTO scan_logs
      (tracking_id, qr_type, scanned_by, scanned_phone,
       scan_datetime, latitude, longitude,
       scan_mode, device_id, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING scan_id;
  `;
    const values = [
        scan.tracking_id,
        scan.qr_type,
        userId,
        scan.scanned_phone || null,
        scan.scan_datetime,
        scan.latitude || null,
        scan.longitude || null,
        scan.scan_mode,
        scan.device_id || null,
        userId,
    ];
    const result = await db_1.default.query(scanQuery, values);
    // Create movement event
    const eventQuery = `
    INSERT INTO package_events
      (tracking_id, event_type, event_datetime, user_id,
       latitude, longitude, created_by)
    VALUES ($1,'IN_TRANSIT',$2,$3,$4,$5,$6);
  `;
    await db_1.default.query(eventQuery, [
        scan.tracking_id,
        scan.scan_datetime,
        userId,
        scan.latitude || null,
        scan.longitude || null,
        userId,
    ]);
    return result.rows[0];
};
exports.saveScan = saveScan;
const getScanHistory = async (trackingId) => {
    const { rows } = await db_1.default.query(`
    SELECT *
    FROM scan_logs
    WHERE tracking_id = $1
    ORDER BY scan_datetime ASC
    `, [trackingId]);
    return rows;
};
exports.getScanHistory = getScanHistory;
