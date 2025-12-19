"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = void 0;
const db_1 = __importDefault(require("../config/db"));
const logAudit = async (data) => {
    await db_1.default.query(`INSERT INTO audit_logs
     (event_type, entity_type, entity_id, action, description,
      performed_by, role_id, ip_address, user_agent, request_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
        data.event_type,
        data.entity_type,
        data.entity_id || null,
        data.action,
        data.description || null,
        data.performed_by || null,
        data.role_id || null,
        data.ip_address || null,
        data.user_agent || null,
        data.request_payload || null,
    ]);
};
exports.logAudit = logAudit;
