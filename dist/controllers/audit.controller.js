"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const db_1 = __importDefault(require("../config/db"));
const list = async (req, res) => {
    debugger;
    const { event_type, entity_type, from, to } = req.query;
    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];
    if (event_type) {
        params.push(event_type);
        query += ` AND event_type=$${params.length}`;
    }
    if (entity_type) {
        params.push(entity_type);
        query += ` AND entity_type=$${params.length}`;
    }
    if (from && to) {
        params.push(from, to);
        query += ` AND created_on BETWEEN $${params.length - 1} AND $${params.length}`;
    }
    query += ` ORDER BY created_on DESC`;
    const { rows } = await db_1.default.query(query, params);
    res.json({ success: true, data: rows });
};
exports.list = list;
