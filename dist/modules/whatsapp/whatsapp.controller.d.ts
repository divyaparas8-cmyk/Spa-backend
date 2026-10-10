import { Request, Response, NextFunction } from 'express';
export declare class WhatsAppController {
    /**
     * GET /api/v1/whatsapp/webhook — Meta webhook verification handshake
     * Meta sends: hub.mode, hub.verify_token, hub.challenge
     * We validate the token and echo back the challenge string.
     */
    verifyWebhook(req: Request, res: Response, _next: NextFunction): Promise<void>;
    getAutomations(_req: Request, res: Response, next: NextFunction): Promise<void>;
    getAutomationByType(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateAutomation(req: Request, res: Response, next: NextFunction): Promise<void>;
    processReminders(_req: Request, res: Response, next: NextFunction): Promise<void>;
    triggerDailyClose(req: Request, res: Response, next: NextFunction): Promise<void>;
    triggerAfterService(req: Request, res: Response, next: NextFunction): Promise<void>;
    triggerPaymentConfirmation(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoiceReceiptStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    triggerCelebrations(_req: Request, res: Response, next: NextFunction): Promise<void>;
    triggerRebookingReminders(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendCustom(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
    retryMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const whatsappController: WhatsAppController;
//# sourceMappingURL=whatsapp.controller.d.ts.map