"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const package_routes_1 = __importDefault(require("./package.routes"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const scan_routes_1 = __importDefault(require("./scan.routes"));
const state_routes_1 = __importDefault(require("./state.routes"));
const city_routes_1 = __importDefault(require("./city.routes"));
const centre_routes_1 = __importDefault(require("./centre.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const audit_routes_1 = __importDefault(require("./audit.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const router = (0, express_1.Router)();
router.use("/audit", audit_routes_1.default);
router.use("/reports", report_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/masters/roles", role_routes_1.default);
router.use("/masters/states", state_routes_1.default);
router.use("/masters/cities", city_routes_1.default);
router.use("/masters/centres", centre_routes_1.default);
router.use("/scans", scan_routes_1.default);
router.use("/auth", auth_routes_1.default);
router.use("/packages", package_routes_1.default);
router.get("/health", async (_req, res) => {
    const result = await db_1.default.query("SELECT NOW()");
    res.json({
        status: "OK",
        dbTime: result.rows[0].now,
    });
});
router.get("/protected", auth_middleware_1.authMiddleware, (req, res) => {
    res.json({ message: "You are authenticated" });
});
exports.default = router;
