"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStates = exports.createState = void 0;
const db_1 = __importDefault(require("../config/db"));
const createState = async (data, userId) => {
    const { rows } = await db_1.default.query(`INSERT INTO states (state_name, state_code, created_by)
     VALUES ($1,$2,$3) RETURNING *`, [data.state_name, data.state_code, userId]);
    return rows[0];
};
exports.createState = createState;
const getStates = async () => {
    const { rows } = await db_1.default.query(`SELECT * FROM states ORDER BY state_name`);
    return rows;
};
exports.getStates = getStates;
