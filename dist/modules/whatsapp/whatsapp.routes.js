"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_controller_1 = require("./whatsapp.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const roleMiddleware_1 = require("../../middleware/roleMiddleware");
const router = (0, express_1.Router)();
// Inbound webhook: GET for Meta verification handshake (public endpoint)
router.get('/webhook', (req, res, next) => whatsapp_controller_1.whatsappController.verifyWebhook(req, res, next));
// Inbound webhook: POST for delivery status updates (public endpoint)
router.post('/webhook', (req, res, next) => whatsapp_controller_1.whatsappController.handleWebhook(req, res, next));
// All subsequent routes require authentication
router.use(authMiddleware_1.authMiddleware);
// GET /api/v1/whatsapp/automations - View automations (Manager, Reception)
router.get('/automations', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.getAutomations(req, res, next));
// GET /api/v1/whatsapp/automations/:type - View single automation setting (Manager, Reception)
router.get('/automations/:type', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.getAutomationByType(req, res, next));
// PATCH /api/v1/whatsapp/automations/:type - Update automation configuration (Manager only)
router.patch('/automations/:type', (0, roleMiddleware_1.allowRoles)('MANAGER'), (req, res, next) => whatsapp_controller_1.whatsappController.updateAutomation(req, res, next));
// POST /api/v1/whatsapp/triggers/process-reminders - Database-driven reminder processing (Manager, Reception)
router.post('/triggers/process-reminders', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.processReminders(req, res, next));
// POST /api/v1/whatsapp/triggers/after-service - After-service thank you trigger (Manager, Reception)
router.post('/triggers/after-service', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.triggerAfterService(req, res, next));
// POST /api/v1/whatsapp/triggers/payment-confirmation - Payment confirmation trigger (Manager, Reception)
router.post('/triggers/payment-confirmation', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.triggerPaymentConfirmation(req, res, next));
// POST /api/v1/whatsapp/triggers/send-invoice-pdf - Send official PDF Receipt via WhatsApp (Manager, Reception)
router.post('/triggers/send-invoice-pdf', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.sendInvoicePdf(req, res, next));
// GET /api/v1/whatsapp/invoices/:id/receipt-status - Check if receipt was already sent (Manager, Reception)
router.get('/invoices/:id/receipt-status', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.getInvoiceReceiptStatus(req, res, next));
// POST /api/v1/whatsapp/triggers/celebrations - Birthday & anniversary trigger (Manager, Reception)
router.post('/triggers/celebrations', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.triggerCelebrations(req, res, next));
// POST /api/v1/whatsapp/triggers/rebooking-reminders - Rebooking retention trigger (Manager, Reception)
router.post('/triggers/rebooking-reminders', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.triggerRebookingReminders(req, res, next));
// POST /api/v1/whatsapp/triggers/daily-close - Trigger Daily Close summary to Boss (Manager only)
router.post('/triggers/daily-close', (0, roleMiddleware_1.allowRoles)('MANAGER'), (req, res, next) => whatsapp_controller_1.whatsappController.triggerDailyClose(req, res, next));
// POST /api/v1/whatsapp/triggers/send - Dispatch single custom message with idempotency (Manager, Reception)
router.post('/triggers/send', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.sendCustom(req, res, next));
// GET /api/v1/whatsapp/logs - Audit logs with filtering & pagination (Manager, Reception)
router.get('/logs', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.getLogs(req, res, next));
// POST /api/v1/whatsapp/logs/:id/retry - Retry message (Manager, Reception)
router.post('/logs/:id/retry', (0, roleMiddleware_1.allowRoles)('MANAGER', 'RECEPTION'), (req, res, next) => whatsapp_controller_1.whatsappController.retryMessage(req, res, next));
exports.default = router;
//# sourceMappingURL=whatsapp.routes.js.map