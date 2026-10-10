"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionsService = exports.CommissionsService = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
class CommissionsService {
    /**
     * Automatically calculates and generates technician commissions for a PAID invoice.
     * - Only executes if invoice status === PAID.
     * - Idempotent: Prevents duplicate commission generation.
     * - Calculates based on the actual technician assigned to each service item.
     * - Supports service-wise commission percentages.
     * - Also generates employee referral commissions if applicable.
     */
    async generateCommissionsForInvoice(invoiceId, txClient) {
        const client = txClient || database_1.default;
        const invoice = await client.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: {
                    include: {
                        service: true,
                        technician: {
                            include: { staffProfile: true },
                        },
                    },
                },
            },
        });
        if (!invoice)
            return;
        // Requirement: Commission ONLY after payment received (PAID invoice)
        if (invoice.status !== client_1.InvoiceStatus.PAID) {
            return;
        }
        // Requirement: Prevent duplicate commission creation for the same invoice
        const existingCount = await client.technicianCommission.count({
            where: { invoiceId },
        });
        if (existingCount > 0) {
            return; // Already generated
        }
        // Fetch active service commission rules from CommissionRule table
        const serviceRules = await client.commissionRule.findMany({
            where: { type: client_1.CommissionType.SERVICE, isActive: true },
        });
        const ruleMap = new Map();
        for (const r of serviceRules) {
            if (r.serviceCategory) {
                ruleMap.set(r.serviceCategory.toLowerCase(), Number(r.percentage));
            }
        }
        const serviceItems = invoice.items.filter((item) => item.itemType === client_1.InvoiceItemType.SERVICE && item.technicianId);
        for (const item of serviceItems) {
            const category = (item.service?.category || '').toLowerCase();
            const sName = item.name.toLowerCase();
            // Service-wise commission rate determination:
            // Check database rule first, then standard category defaults
            let rate = 10; // default 10%
            if (ruleMap.has(category)) {
                rate = ruleMap.get(category);
            }
            else if (category.includes('nail') || sName.includes('nail')) {
                rate = 15; // Nails: 15%
            }
            else if (category.includes('facial') || sName.includes('facial')) {
                rate = 12; // Facial: 12%
            }
            else if (category.includes('massage') || sName.includes('massage')) {
                rate = 10; // Massage: 10%
            }
            const itemTotal = Number(item.price) * item.quantity;
            const baseCommission = Math.round(((itemTotal * rate) / 100) * 100) / 100;
            const commission = await client.technicianCommission.create({
                data: {
                    technicianId: item.technicianId,
                    invoiceId: invoice.id,
                    appointmentServiceId: item.appointmentServiceId || null,
                    serviceId: item.serviceId || null,
                    serviceName: item.name,
                    serviceCategory: item.service?.category || null,
                    servicePrice: new client_1.Prisma.Decimal(itemTotal),
                    commissionRate: new client_1.Prisma.Decimal(rate),
                    baseCommission: new client_1.Prisma.Decimal(baseCommission),
                    bonusAmount: new client_1.Prisma.Decimal(0),
                    totalCommission: new client_1.Prisma.Decimal(baseCommission),
                    status: client_1.CommissionStatus.PENDING,
                    notes: `Generated on payment for Invoice ${invoice.invoiceNumber}`,
                },
            });
            // Audit trail: log CommissionActivity
            await client.commissionActivity.create({
                data: {
                    technicianCommissionId: commission.id,
                    type: client_1.CommissionActivityType.GENERATED,
                    amount: new client_1.Prisma.Decimal(baseCommission),
                    previousTotal: new client_1.Prisma.Decimal(0),
                    newTotal: new client_1.Prisma.Decimal(baseCommission),
                    reason: `Commission generated at ${rate}% for service "${item.name}" upon payment of Invoice ${invoice.invoiceNumber}`,
                },
            });
        }
        // Generate employee referral commission if the client was introduced by an employee
        await this.generateEmployeeReferralCommission(invoiceId, client);
    }
    /**
     * Generates EmployeeCommission for the employee who introduced the client.
     * - Looks up client.introducedByEmployeeId from the invoice's client.
     * - Applies REFERRAL commission rules from CommissionRule table.
     * - Idempotent: Skips if EmployeeCommission already exists for this invoice.
     * - The referring employee must NOT be a MANAGER (Managers cannot earn referral commissions).
     */
    async generateEmployeeReferralCommission(invoiceId, client) {
        const invoice = await client.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: {
                    select: {
                        id: true,
                        introducedByEmployeeId: true,
                        source: true,
                    },
                },
            },
        });
        if (!invoice || !invoice.client)
            return;
        if (!invoice.client.introducedByEmployeeId)
            return;
        if (invoice.client.source !== 'STAFF_REFERRAL')
            return;
        const employeeId = invoice.client.introducedByEmployeeId;
        // Verify the referring employee exists, is active, and is NOT a Manager
        const employee = await client.user.findUnique({
            where: { id: employeeId },
            include: { role: true },
        });
        if (!employee || !employee.isActive)
            return;
        if (employee.role?.name === 'MANAGER')
            return;
        // Idempotency: Check if EmployeeCommission already exists for this invoice + employee
        const existingEmployeeComm = await client.employeeCommission.count({
            where: { invoiceId, employeeId },
        });
        if (existingEmployeeComm > 0)
            return;
        // Look up active REFERRAL commission rule
        const referralRules = await client.commissionRule.findMany({
            where: { type: client_1.CommissionType.REFERRAL, isActive: true },
        });
        if (referralRules.length === 0)
            return; // No referral rule configured — skip
        const rule = referralRules[0]; // Use the first active referral rule
        const invoiceTotal = Number(invoice.total);
        // Calculate referral commission: percentage of invoice total, or fixed amount
        let commissionAmount = 0;
        if (rule.fixedAmount && Number(rule.fixedAmount) > 0) {
            commissionAmount = Number(rule.fixedAmount);
        }
        else {
            commissionAmount = Math.round(((invoiceTotal * Number(rule.percentage)) / 100) * 100) / 100;
        }
        if (commissionAmount <= 0)
            return;
        // Create EmployeeCommission record
        await client.employeeCommission.create({
            data: {
                employeeId,
                invoiceId,
                commissionRuleId: rule.id,
                amount: new client_1.Prisma.Decimal(commissionAmount),
                status: client_1.CommissionStatus.PENDING,
            },
        });
    }
    /**
     * Get commissions list with filtering, summary stats, and RBAC enforcement.
     * TECHNICIAN: Automatically scoped to their own commissions only.
     */
    async getCommissions(query, authUser) {
        const page = Math.max(1, parseInt(String(query.page || 1), 10));
        const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 20), 10)));
        const skip = (page - 1) * limit;
        const where = {};
        // RBAC: Technician can ONLY view their own commissions
        if (authUser.role === 'TECHNICIAN') {
            where.technicianId = authUser.id;
        }
        else if (query.technicianId) {
            where.technicianId = query.technicianId;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = new Date(query.startDate);
            if (query.endDate)
                where.createdAt.lte = new Date(query.endDate);
        }
        const [total, commissions, allMatching] = await Promise.all([
            database_1.default.technicianCommission.count({ where }),
            database_1.default.technicianCommission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    technician: {
                        select: { id: true, email: true, staffProfile: { select: { name: true, phone: true } } },
                    },
                    invoice: {
                        select: { id: true, invoiceNumber: true, status: true, total: true, date: true },
                    },
                    activities: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            performedBy: {
                                select: { id: true, email: true, staffProfile: { select: { name: true } } },
                            },
                        },
                    },
                },
            }),
            database_1.default.technicianCommission.findMany({
                where,
                select: {
                    baseCommission: true,
                    bonusAmount: true,
                    totalCommission: true,
                    status: true,
                },
            }),
        ]);
        // Aggregate summary statistics
        let totalBase = 0;
        let totalBonus = 0;
        let totalOverall = 0;
        let totalApproved = 0;
        let totalPending = 0;
        for (const c of allMatching) {
            const base = Number(c.baseCommission);
            const bonus = Number(c.bonusAmount);
            const tot = Number(c.totalCommission);
            totalBase += base;
            totalBonus += bonus;
            totalOverall += tot;
            if (c.status === client_1.CommissionStatus.APPROVED || c.status === client_1.CommissionStatus.PAID) {
                totalApproved += tot;
            }
            else {
                totalPending += tot;
            }
        }
        const formatted = commissions.map((c) => ({
            ...c,
            servicePrice: Number(c.servicePrice),
            commissionRate: Number(c.commissionRate),
            baseCommission: Number(c.baseCommission),
            bonusAmount: Number(c.bonusAmount),
            totalCommission: Number(c.totalCommission),
            activities: c.activities.map((a) => ({
                ...a,
                amount: Number(a.amount),
                previousTotal: a.previousTotal ? Number(a.previousTotal) : null,
                newTotal: a.newTotal ? Number(a.newTotal) : null,
            })),
        }));
        return {
            commissions: formatted,
            summary: {
                totalBaseCommission: totalBase,
                totalBonusAmount: totalBonus,
                totalEarned: totalOverall,
                totalApproved,
                totalPending,
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get specific technician commission report.
     * TECHNICIAN: Blocked with 403 Forbidden if requesting another technician's report.
     */
    async getTechnicianCommissions(technicianId, query, authUser) {
        if (authUser.role === 'TECHNICIAN' && technicianId !== authUser.id) {
            throw new errorHandler_1.AppError('Access forbidden: you can only view your own commission history', constants_1.HTTP_STATUS.FORBIDDEN);
        }
        const technician = await database_1.default.user.findUnique({
            where: { id: technicianId },
            include: { staffProfile: true },
        });
        if (!technician) {
            throw new errorHandler_1.AppError('Technician not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const queryWithTech = {
            ...query,
            technicianId,
        };
        const report = await this.getCommissions(queryWithTech, authUser);
        return {
            technician: {
                id: technician.id,
                email: technician.email,
                name: technician.staffProfile?.name || technician.email,
                phone: technician.staffProfile?.phone || null,
            },
            ...report,
        };
    }
    /**
     * Manager adds a performance bonus to a technician's commission record.
     * Logs CommissionActivity with BONUS_ADDED.
     */
    async addBonus(commissionId, input, authUser) {
        const commission = await database_1.default.technicianCommission.findUnique({
            where: { id: commissionId },
        });
        if (!commission) {
            throw new errorHandler_1.AppError('Commission record not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        return database_1.default.$transaction(async (tx) => {
            const prevBonus = Number(commission.bonusAmount);
            const prevTotal = Number(commission.totalCommission);
            const newBonus = prevBonus + input.bonusAmount;
            const newTotal = prevTotal + input.bonusAmount;
            const updated = await tx.technicianCommission.update({
                where: { id: commissionId },
                data: {
                    bonusAmount: new client_1.Prisma.Decimal(newBonus),
                    totalCommission: new client_1.Prisma.Decimal(newTotal),
                },
            });
            const reason = input.reason ? input.reason.trim() : 'Performance bonus awarded by Manager';
            await tx.commissionActivity.create({
                data: {
                    technicianCommissionId: commissionId,
                    type: client_1.CommissionActivityType.BONUS_ADDED,
                    amount: new client_1.Prisma.Decimal(input.bonusAmount),
                    previousTotal: new client_1.Prisma.Decimal(prevTotal),
                    newTotal: new client_1.Prisma.Decimal(newTotal),
                    reason,
                    performedById: authUser.id,
                },
            });
            return {
                ...updated,
                servicePrice: Number(updated.servicePrice),
                commissionRate: Number(updated.commissionRate),
                baseCommission: Number(updated.baseCommission),
                bonusAmount: Number(updated.bonusAmount),
                totalCommission: Number(updated.totalCommission),
            };
        });
    }
    /**
     * Manager adjusts commission amount or rate with mandatory reason.
     * Logs CommissionActivity with ADJUSTED.
     */
    async adjustCommission(commissionId, input, authUser) {
        const commission = await database_1.default.technicianCommission.findUnique({
            where: { id: commissionId },
        });
        if (!commission) {
            throw new errorHandler_1.AppError('Commission record not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        return database_1.default.$transaction(async (tx) => {
            const prevTotal = Number(commission.totalCommission);
            let newBase = Number(commission.baseCommission);
            let newRate = Number(commission.commissionRate);
            if (input.adjustedRate !== undefined) {
                newRate = input.adjustedRate;
                newBase = Math.round(((Number(commission.servicePrice) * newRate) / 100) * 100) / 100;
            }
            else if (input.adjustedAmount !== undefined) {
                newBase = input.adjustedAmount;
            }
            const newTotal = newBase + Number(commission.bonusAmount);
            const updated = await tx.technicianCommission.update({
                where: { id: commissionId },
                data: {
                    baseCommission: new client_1.Prisma.Decimal(newBase),
                    commissionRate: new client_1.Prisma.Decimal(newRate),
                    totalCommission: new client_1.Prisma.Decimal(newTotal),
                    status: client_1.CommissionStatus.ADJUSTED,
                },
            });
            await tx.commissionActivity.create({
                data: {
                    technicianCommissionId: commissionId,
                    type: client_1.CommissionActivityType.ADJUSTED,
                    amount: new client_1.Prisma.Decimal(newTotal - prevTotal),
                    previousTotal: new client_1.Prisma.Decimal(prevTotal),
                    newTotal: new client_1.Prisma.Decimal(newTotal),
                    reason: input.reason.trim(),
                    performedById: authUser.id,
                },
            });
            return {
                ...updated,
                servicePrice: Number(updated.servicePrice),
                commissionRate: Number(updated.commissionRate),
                baseCommission: Number(updated.baseCommission),
                bonusAmount: Number(updated.bonusAmount),
                totalCommission: Number(updated.totalCommission),
            };
        });
    }
    /**
     * Manager approves commission record.
     * Logs CommissionActivity with APPROVED.
     */
    async approveCommission(commissionId, authUser) {
        const commission = await database_1.default.technicianCommission.findUnique({
            where: { id: commissionId },
        });
        if (!commission) {
            throw new errorHandler_1.AppError('Commission record not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const now = new Date();
        return database_1.default.$transaction(async (tx) => {
            const updated = await tx.technicianCommission.update({
                where: { id: commissionId },
                data: {
                    status: client_1.CommissionStatus.APPROVED,
                    approvedById: authUser.id,
                    approvedAt: now,
                },
            });
            await tx.commissionActivity.create({
                data: {
                    technicianCommissionId: commissionId,
                    type: client_1.CommissionActivityType.APPROVED,
                    amount: updated.totalCommission,
                    previousTotal: updated.totalCommission,
                    newTotal: updated.totalCommission,
                    reason: 'Commission approved by Manager',
                    performedById: authUser.id,
                },
            });
            return {
                ...updated,
                servicePrice: Number(updated.servicePrice),
                commissionRate: Number(updated.commissionRate),
                baseCommission: Number(updated.baseCommission),
                bonusAmount: Number(updated.bonusAmount),
                totalCommission: Number(updated.totalCommission),
            };
        });
    }
    /**
     * Manager sets/updates service-wise commission rules.
     */
    async setCommissionRule(input) {
        const existing = await database_1.default.commissionRule.findFirst({
            where: {
                type: client_1.CommissionType.SERVICE,
                serviceCategory: input.serviceCategory.trim(),
            },
        });
        if (existing) {
            return database_1.default.commissionRule.update({
                where: { id: existing.id },
                data: {
                    percentage: new client_1.Prisma.Decimal(input.percentage),
                    fixedAmount: input.fixedAmount ? new client_1.Prisma.Decimal(input.fixedAmount) : null,
                    isActive: true,
                },
            });
        }
        return database_1.default.commissionRule.create({
            data: {
                type: client_1.CommissionType.SERVICE,
                serviceCategory: input.serviceCategory.trim(),
                percentage: new client_1.Prisma.Decimal(input.percentage),
                fixedAmount: input.fixedAmount ? new client_1.Prisma.Decimal(input.fixedAmount) : null,
                isActive: true,
            },
        });
    }
    async getCommissionRules() {
        return database_1.default.commissionRule.findMany({
            where: { type: client_1.CommissionType.SERVICE, isActive: true },
            orderBy: { serviceCategory: 'asc' },
        });
    }
}
exports.CommissionsService = CommissionsService;
exports.commissionsService = new CommissionsService();
//# sourceMappingURL=commissions.service.js.map