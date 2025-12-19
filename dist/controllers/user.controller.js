"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPwd = exports.deactivate = exports.activate = exports.update = exports.getById = exports.list = exports.create = void 0;
const service = __importStar(require("../services/user.service"));
const create = async (req, res) => {
    const user = await service.createUser(req.body, req.user.user_id);
    res.json({ success: true, data: user });
};
exports.create = create;
const list = async (_req, res) => {
    const users = await service.getUsers();
    res.json({ success: true, data: users });
};
exports.list = list;
const getById = async (req, res) => {
    const user = await service.getUserById(Number(req.params.id));
    res.json({ success: true, data: user });
};
exports.getById = getById;
const update = async (req, res) => {
    const user = await service.updateUser(Number(req.params.id), req.body, req.user.user_id);
    res.json({ success: true, data: user });
};
exports.update = update;
const activate = async (req, res) => {
    const user = await service.toggleUserStatus(Number(req.params.id), true, req.user.user_id);
    res.json({ success: true, data: user });
};
exports.activate = activate;
const deactivate = async (req, res) => {
    const user = await service.toggleUserStatus(Number(req.params.id), false, req.user.user_id);
    res.json({ success: true, data: user });
};
exports.deactivate = deactivate;
const resetPwd = async (req, res) => {
    await service.resetPassword(Number(req.params.id), req.body.password, req.user.user_id);
    res.json({ success: true, message: "Password reset successfully" });
};
exports.resetPwd = resetPwd;
