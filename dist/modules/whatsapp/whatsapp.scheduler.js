"use strict";
/**
 * OMEGA SPA POS — WhatsApp Automation Scheduler
 *
 * Background cron jobs for automated WhatsApp message dispatch.
 * Uses node-cron with Africa/Douala timezone.
 *
 * Jobs:
 *   - Every hour (0 * * * *): Appointment 24h & 2h reminders
 *   - Daily 09:00 (0 9 * * *): Birthday & Anniversary greetings
 *   - Daily 10:00 (0 10 * * *): Rebooking inactive client reminders
 *   - Daily 19:30 (30 19 * * *): Daily Close Boss Summary
 *
 * Automatically initialized during backend startup via server.ts.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWhatsAppScheduler = initWhatsAppScheduler;
exports.stopWhatsAppScheduler = stopWhatsAppScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../../utils/logger");
const whatsapp_service_1 = require("./whatsapp.service");
const WHATSAPP_TIMEZONE = 'Africa/Douala';
const scheduledJobs = [];
/**
 * Creates a guarded cron job that prevents duplicate concurrent runs
 */
function createGuardedJob(name, cronExpression, handler) {
    const state = {
        task: null,
        name,
        isRunning: false,
    };
    state.task = node_cron_1.default.schedule(cronExpression, async () => {
        if (state.isRunning) {
            logger_1.logger.warn(`[WhatsApp Scheduler] ${name}: Previous run still in progress. Skipping.`);
            return;
        }
        state.isRunning = true;
        try {
            logger_1.logger.info(`[WhatsApp Scheduler] ${name}: Starting...`);
            await handler();
            logger_1.logger.info(`[WhatsApp Scheduler] ${name}: Completed successfully.`);
        }
        catch (err) {
            logger_1.logger.error(`[WhatsApp Scheduler] ${name}: Error during execution`, {
                error: err?.message || String(err),
            });
        }
        finally {
            state.isRunning = false;
        }
    }, {
        timezone: WHATSAPP_TIMEZONE,
    });
    return state;
}
/**
 * Initializes all WhatsApp automation cron jobs
 */
function initWhatsAppScheduler() {
    if (scheduledJobs.length > 0) {
        logger_1.logger.info('[WhatsApp Scheduler] WhatsApp scheduler already active.');
        return;
    }
    logger_1.logger.info(`[WhatsApp Scheduler] Initializing WhatsApp automation cron jobs (timezone: ${WHATSAPP_TIMEZONE})`);
    // 1. Every hour: Appointment reminders (24h and 2h window checks)
    scheduledJobs.push(createGuardedJob('Appointment Reminders (24h/2h)', '0 * * * *', async () => {
        const result = await whatsapp_service_1.whatsappService.processScheduledReminders();
        logger_1.logger.info('[WhatsApp Scheduler] Appointment reminders processed', {
            totalScheduled: result.processedCount,
            reminders24hSent: result.reminders24hSent,
            reminders2hSent: result.reminders2hSent,
            skipped: result.skippedCount,
        });
    }));
    // 2. Daily 09:00: Birthday & Anniversary celebrations
    scheduledJobs.push(createGuardedJob('Birthday & Anniversary Greetings', '0 9 * * *', async () => {
        const result = await whatsapp_service_1.whatsappService.processCelebrationReminders();
        logger_1.logger.info('[WhatsApp Scheduler] Celebrations processed', {
            clients: result.processedClients,
            birthdaysSent: result.birthdaysSent,
            anniversariesSent: result.anniversariesSent,
            skipped: result.skippedCount,
        });
    }));
    // 3. Daily 10:00: Rebooking reminders for inactive clients (4+ months)
    scheduledJobs.push(createGuardedJob('Rebooking Inactive Clients', '0 10 * * *', async () => {
        const result = await whatsapp_service_1.whatsappService.processRebookingReminders();
        logger_1.logger.info('[WhatsApp Scheduler] Rebooking reminders processed', {
            processedCount: result.processedCount,
            sentCount: result.sentCount,
            skippedCount: result.skippedCount,
        });
    }));
    // 4. Daily 19:30: Daily Close Boss Summary
    scheduledJobs.push(createGuardedJob('Daily Close Boss Summary', '30 19 * * *', async () => {
        const todayStr = new Date().toISOString().split('T')[0];
        // Use a system-level auth context for automated trigger
        const systemAuthUser = { id: 'system', role: 'MANAGER', email: 'system@omegaspa.com' };
        const result = await whatsapp_service_1.whatsappService.triggerDailyCloseBoss({ businessDate: todayStr }, systemAuthUser);
        logger_1.logger.info('[WhatsApp Scheduler] Daily close summary dispatched', {
            alreadySent: result.alreadySent,
            logId: result.log?.id,
        });
    }));
    logger_1.logger.info(`✓ [WhatsApp Scheduler] ${scheduledJobs.length} WhatsApp automation cron jobs registered:`);
    logger_1.logger.info('  • Every hour: Appointment 24h/2h reminders');
    logger_1.logger.info('  • Daily 09:00: Birthday & Anniversary greetings');
    logger_1.logger.info('  • Daily 10:00: Rebooking inactive client reminders');
    logger_1.logger.info('  • Daily 19:30: Daily Close Boss Summary');
}
/**
 * Stops all WhatsApp scheduled cron tasks
 */
function stopWhatsAppScheduler() {
    for (const job of scheduledJobs) {
        job.task.stop();
        logger_1.logger.info(`[WhatsApp Scheduler] Stopped: ${job.name}`);
    }
    scheduledJobs.length = 0;
    logger_1.logger.info('[WhatsApp Scheduler] All WhatsApp automation cron jobs stopped.');
}
//# sourceMappingURL=whatsapp.scheduler.js.map