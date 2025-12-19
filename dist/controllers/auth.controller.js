"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await (0, auth_service_1.loginUser)({ username, password });
        res.json({ success: true, ...result });
    }
    catch (err) {
        res.status(401).json({
            success: false,
            message: err.message,
        });
    }
};
exports.login = login;
