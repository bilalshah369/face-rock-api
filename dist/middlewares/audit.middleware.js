"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
const audit_service_1 = require("../services/audit.service");
const auditMiddleware = (eventType, entityType) => {
    return async (req, res, next) => {
        res.on("finish", async () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                await (0, audit_service_1.logAudit)({
                    event_type: eventType,
                    entity_type: entityType,
                    entity_id: req.params?.id,
                    action: req.method,
                    performed_by: req.user?.user_id,
                    role_id: req.user?.role_id,
                    ip_address: req.ip,
                    user_agent: req.headers["user-agent"],
                    request_payload: req.body,
                });
            }
        });
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
