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
exports.getScans = exports.singleScan = exports.syncScans = void 0;
const service = __importStar(require("../services/scan.service"));
const syncScans = async (req, res) => {
    const scans = req.body.scans;
    if (!Array.isArray(scans)) {
        return res.status(400).json({ message: "Invalid scans payload" });
    }
    const results = [];
    for (const scan of scans) {
        const result = await service.saveScan(scan, req.user.user_id);
        results.push({
            tracking_id: scan.tracking_id,
            scan_id: result.scan_id,
            status: "SYNCED",
        });
    }
    res.json({
        success: true,
        synced: results.length,
        results,
    });
};
exports.syncScans = syncScans;
const singleScan = async (req, res) => {
    const result = await service.saveScan(req.body, req.user.user_id);
    res.json({ success: true, data: result });
};
exports.singleScan = singleScan;
const getScans = async (req, res) => {
    const scans = await service.getScanHistory(req.params.trackingId);
    res.json({ success: true, data: scans });
};
exports.getScans = getScans;
