"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
});
pool.on("connect", () => {
    console.log("✅ PostgreSQL connected");
});
pool.on("error", (err) => {
    console.error("❌ PostgreSQL error", err);
    process.exit(1);
});
exports.default = pool;
