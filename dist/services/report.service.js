"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsSummary = exports.userScanActivity = exports.scanActivity = exports.packagesByCentre = exports.overallSummary = void 0;
const db_1 = __importDefault(require("../config/db"));
const overallSummary = async () => {
    const { rows } = await db_1.default.query(`
    SELECT
      COUNT(*) AS total_packages,
      COUNT(*) FILTER (WHERE status = 'DISPATCHED') AS dispatched,
      COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
      COUNT(*) FILTER (WHERE status = 'RETURNED') AS returned,
      COUNT(*) FILTER (WHERE status = 'CREATED') AS pending
    FROM outer_packages
  `);
    return rows[0];
};
exports.overallSummary = overallSummary;
const packagesByCentre = async () => {
    const { rows } = await db_1.default.query(`
    SELECT
      c.centre_name,
      COUNT(o.outer_package_id) AS total_packages,
      COUNT(*) FILTER (WHERE o.status = 'DELIVERED') AS delivered,
      COUNT(*) FILTER (WHERE o.status != 'DELIVERED') AS pending
    FROM outer_packages o
    JOIN centres c ON c.centre_id = o.destination_centre_id
    GROUP BY c.centre_name
    ORDER BY c.centre_name
  `);
    return rows;
};
exports.packagesByCentre = packagesByCentre;
const scanActivity = async () => {
    const { rows } = await db_1.default.query(`
    SELECT
      DATE(scan_datetime) AS scan_date,
      COUNT(*) AS total_scans,
      COUNT(*) FILTER (WHERE scan_mode = 'OFFLINE') AS offline_scans,
      COUNT(*) FILTER (WHERE scan_mode = 'ONLINE') AS online_scans
    FROM scan_logs
    GROUP BY DATE(scan_datetime)
    ORDER BY scan_date DESC
  `);
    return rows;
};
exports.scanActivity = scanActivity;
const userScanActivity = async () => {
    const { rows } = await db_1.default.query(`
    SELECT
      u.username,
      COUNT(s.scan_id) AS scans
    FROM scan_logs s
    JOIN users u ON u.user_id = s.scanned_by
    GROUP BY u.username
    ORDER BY scans DESC
  `);
    return rows;
};
exports.userScanActivity = userScanActivity;
const alertsSummary = async () => {
    const { rows } = await db_1.default.query(`
    SELECT
      alert_type,
      COUNT(*) AS total
    FROM alerts
    GROUP BY alert_type
  `);
    return rows;
};
exports.alertsSummary = alertsSummary;
