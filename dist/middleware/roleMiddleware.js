"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.allowRoles = void 0;
const constants_1 = require("../config/constants");
const response_1 = require("../utils/response");
const allowRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', constants_1.HTTP_STATUS.UNAUTHORIZED);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'Access forbidden: insufficient permissions', constants_1.HTTP_STATUS.FORBIDDEN);
            return;
        }
        next();
    };
};
exports.allowRoles = allowRoles;
exports.requireRoles = exports.allowRoles;
//# sourceMappingURL=roleMiddleware.js.map