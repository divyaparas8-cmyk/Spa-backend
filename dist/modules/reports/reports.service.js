"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const client_1 = require("@prisma/client");
class ReportsService {
    /**
     * Helper to resolve and parse date range from query parameters.
     */
    parseDateRange(query) {
        const now = new Date();
        const period = query.period || 'monthly';
        let startDate;
        let endDate;
        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
        else if (period === 'weekly') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (period === 'monthly') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
        }
        else if (period === 'custom') {
            if (!query.startDate) {
                throw new errorHandler_1.AppError('startDate is required for custom date range', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
            startDate = new Date(query.startDate);
            if (isNaN(startDate.getTime())) {
                throw new errorHandler_1.AppError('Invalid startDate format', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
            startDate.setHours(0, 0, 0, 0);
            if (query.endDate) {
                endDate = new Date(query.endDate);
                if (isNaN(endDate.getTime())) {
                    throw new errorHandler_1.AppError('Invalid endDate format', constants_1.HTTP_STATUS.BAD_REQUEST);
                }
                endDate.setHours(23, 59, 59, 999);
            }
            else {
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
            }
            if (startDate > endDate) {
                throw new errorHandler_1.AppError('startDate cannot be after endDate', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        }
        else {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = new Date(now);
        }
        return { startDate, endDate, period };
    }
    /**
     * 1. Dashboard Summary Cards
     */
    async getDashboardSummary(query, authUser) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        // Total revenue from Payment table in date range
        const paymentAgg = await database_1.default.payment.aggregate({
            where: {
                paidAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                amount: true,
            },
        });
        const totalRevenue = Number(paymentAgg._sum.amount || 0);
        // Total appointments in date range
        const totalAppointments = await database_1.default.appointment.count({
            where: {
                appointmentDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        // Completed services in date range
        const completedServices = await database_1.default.appointmentService.count({
            where: {
                status: client_1.AppointmentServiceStatus.COMPLETED,
                completedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        // Active clients
        const activeClients = await database_1.default.client.count({
            where: { isActive: true },
        });
        // Pending payments from Invoices
        const pendingInvoices = await database_1.default.invoice.findMany({
            where: {
                status: 'PENDING_PAYMENT',
            },
            include: {
                payments: true,
            },
        });
        let pendingAmount = 0;
        for (const inv of pendingInvoices) {
            const paidSum = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
            const remaining = Math.max(0, Number(inv.total) - paidSum);
            pendingAmount += remaining;
        }
        // Commissions (Sensitive: only included for MANAGER)
        let totalCommissions = undefined;
        if (authUser.role === 'MANAGER') {
            const commsAgg = await database_1.default.technicianCommission.aggregate({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: {
                    totalCommission: true,
                },
            });
            totalCommissions = Number(commsAgg._sum.totalCommission || 0);
        }
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            cards: {
                totalRevenue,
                totalAppointments,
                completedServices,
                activeClients,
                pendingPayments: {
                    count: pendingInvoices.length,
                    amount: pendingAmount,
                },
                ...(totalCommissions !== undefined && { totalCommissions }),
            },
        };
    }
    /**
     * 2. Revenue Analytics & Payment Method Breakdown
     */
    async getRevenueReport(query) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        // Aggregate payments in range
        const payments = await database_1.default.payment.findMany({
            where: {
                paidAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { paidAt: 'asc' },
        });
        let totalRevenue = 0;
        const methodCounts = {
            CASH: { count: 0, amount: 0 },
            MTN_MOMO: { count: 0, amount: 0 },
            ORANGE_MONEY: { count: 0, amount: 0 },
        };
        const timelineMap = new Map();
        for (const p of payments) {
            const amt = Number(p.amount);
            totalRevenue += amt;
            if (methodCounts[p.paymentMethod]) {
                methodCounts[p.paymentMethod].count += 1;
                methodCounts[p.paymentMethod].amount += amt;
            }
            const dateKey = p.paidAt.toISOString().split('T')[0];
            const existing = timelineMap.get(dateKey) || { amount: 0, count: 0 };
            existing.amount += amt;
            existing.count += 1;
            timelineMap.set(dateKey, existing);
        }
        const paymentMethodBreakdown = Object.entries(methodCounts).map(([method, data]) => ({
            method: method,
            count: data.count,
            amount: data.amount,
            percentage: totalRevenue > 0 ? Number(((data.amount / totalRevenue) * 100).toFixed(2)) : 0,
        }));
        const timeline = Array.from(timelineMap.entries()).map(([date, data]) => ({
            date,
            amount: data.amount,
            transactionCount: data.count,
        }));
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            totalRevenue,
            totalTransactions: payments.length,
            paymentMethodBreakdown,
            timeline,
        };
    }
    /**
     * 3. Appointment Analytics
     */
    async getAppointmentAnalytics(query) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        const appointments = await database_1.default.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                status: true,
            },
        });
        const totalBookings = appointments.length;
        const statusCounts = {
            SCHEDULED: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            LATE: 0,
            NO_SHOW: 0,
            CANCELLED: 0,
        };
        for (const a of appointments) {
            if (statusCounts[a.status] !== undefined) {
                statusCounts[a.status] += 1;
            }
        }
        const completed = statusCounts.COMPLETED || 0;
        const noShow = statusCounts.NO_SHOW || 0;
        const late = statusCounts.LATE || 0;
        const completionRate = totalBookings > 0 ? Number(((completed / totalBookings) * 100).toFixed(2)) : 0;
        const noShowRate = totalBookings > 0 ? Number(((noShow / totalBookings) * 100).toFixed(2)) : 0;
        const lateRate = totalBookings > 0 ? Number(((late / totalBookings) * 100).toFixed(2)) : 0;
        const statusBreakdown = Object.keys(statusCounts).map((status) => ({
            status,
            count: statusCounts[status],
            percentage: totalBookings > 0 ? Number(((statusCounts[status] / totalBookings) * 100).toFixed(2)) : 0,
        }));
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            totalBookings,
            completionRate,
            noShowRate,
            lateRate,
            statusBreakdown,
        };
    }
    /**
     * 4. Top Services Report (Ranked by revenue and bookings)
     */
    async getTopServices(query) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        const limit = Math.max(1, Math.min(50, parseInt(String(query.limit || 10), 10)));
        // Fetch all completed appointment services in range
        const completedServices = await database_1.default.appointmentService.findMany({
            where: {
                status: client_1.AppointmentServiceStatus.COMPLETED,
                completedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                service: {
                    select: { id: true, name: true, category: true },
                },
            },
        });
        const serviceMap = new Map();
        for (const cs of completedServices) {
            const sId = cs.serviceId || cs.id;
            const sName = cs.service?.name || 'Spa Service';
            const sCategory = cs.service?.category || 'General';
            const price = Number(cs.price);
            const existing = serviceMap.get(sId) || {
                serviceId: sId,
                serviceName: sName,
                category: sCategory,
                bookingsCount: 0,
                revenueGenerated: 0,
            };
            existing.bookingsCount += 1;
            existing.revenueGenerated += price;
            serviceMap.set(sId, existing);
        }
        const allServices = Array.from(serviceMap.values());
        const topByRevenue = [...allServices]
            .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
            .slice(0, limit);
        const topByBookings = [...allServices]
            .sort((a, b) => b.bookingsCount - a.bookingsCount)
            .slice(0, limit);
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            topByRevenue,
            topByBookings,
        };
    }
    /**
     * 5. Technician Performance Report
     * Strict RBAC:
     * - TECHNICIAN: forced to own ID only.
     * - RECEPTION: operational report only (commission details omitted).
     * - MANAGER: full financial metrics.
     */
    async getTechnicianPerformance(query, authUser) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        // Scoping for technician
        let targetTechnicianId = query.technicianId;
        if (authUser.role === 'TECHNICIAN') {
            if (targetTechnicianId && targetTechnicianId !== authUser.id) {
                throw new errorHandler_1.AppError('Access forbidden: you can only view your own performance', constants_1.HTTP_STATUS.FORBIDDEN);
            }
            targetTechnicianId = authUser.id;
        }
        // Fetch technicians
        const technicians = await database_1.default.user.findMany({
            where: {
                role: { name: 'TECHNICIAN' },
                id: targetTechnicianId ? targetTechnicianId : undefined,
            },
            include: {
                staffProfile: true,
            },
        });
        const performanceList = [];
        for (const tech of technicians) {
            // Completed services count and revenue generated
            const completedServices = await database_1.default.appointmentService.findMany({
                where: {
                    technicianId: tech.id,
                    status: client_1.AppointmentServiceStatus.COMPLETED,
                    completedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: { price: true },
            });
            const servicesCompleted = completedServices.length;
            const revenueGenerated = completedServices.reduce((acc, s) => acc + Number(s.price), 0);
            const averageTicket = servicesCompleted > 0 ? Math.round(revenueGenerated / servicesCompleted) : 0;
            let commissionEarned = undefined;
            // Sensitive financial data: Hide commission details from RECEPTION
            if (authUser.role === 'MANAGER' || authUser.role === 'TECHNICIAN') {
                const commsAgg = await database_1.default.technicianCommission.aggregate({
                    where: {
                        technicianId: tech.id,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: { totalCommission: true },
                });
                commissionEarned = Number(commsAgg._sum.totalCommission || 0);
            }
            performanceList.push({
                technicianId: tech.id,
                technicianName: tech.staffProfile?.name || tech.email,
                email: tech.email,
                phone: tech.staffProfile?.phone || null,
                servicesCompleted,
                revenueGenerated,
                ...(commissionEarned !== undefined && { commissionEarned }),
                averageTicket,
            });
        }
        // Sort by revenue generated descending
        performanceList.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            technicians: performanceList,
        };
    }
    /**
     * 6. Stock Consumption Report (Aggregated from StockActivity)
     */
    async getStockConsumptionReport(query) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        const activities = await database_1.default.stockActivity.findMany({
            where: {
                type: {
                    in: [client_1.StockActivityType.CONSUMPTION, client_1.StockActivityType.SERVICE_USAGE],
                },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                serviceStock: true,
            },
        });
        const stockMap = new Map();
        for (const act of activities) {
            const stock = act.serviceStock;
            const consumedQty = Number(act.quantity);
            const existing = stockMap.get(act.serviceStockId) || {
                serviceStockId: act.serviceStockId,
                stockName: stock.name,
                category: stock.category,
                unit: stock.unit,
                totalConsumed: 0,
                usageCount: 0,
                currentStock: Number(stock.quantity),
            };
            existing.totalConsumed += consumedQty;
            existing.usageCount += 1;
            stockMap.set(act.serviceStockId, existing);
        }
        const items = Array.from(stockMap.values()).sort((a, b) => b.totalConsumed - a.totalConsumed);
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            totalUsageTransactions: activities.length,
            items,
        };
    }
    /**
     * 7. Customer Analytics (Acquisition, Loyalty Growth & Rebooking Retention)
     */
    async getCustomerAnalytics(query) {
        const { startDate, endDate, period } = this.parseDateRange(query);
        // New clients created within range
        const newClients = await database_1.default.client.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        // Total active clients
        const totalActiveClients = await database_1.default.client.count({
            where: { isActive: true },
        });
        // Returning clients: Clients who have more than 1 completed appointment
        const clientCompletedCounts = await database_1.default.appointment.groupBy({
            by: ['clientId'],
            where: {
                status: client_1.AppointmentStatus.COMPLETED,
            },
            _count: { id: true },
            having: {
                id: {
                    _count: { gt: 1 },
                },
            },
        });
        const returningClients = clientCompletedCounts.length;
        // Loyalty growth: points earned vs redeemed in range
        const earnedAgg = await database_1.default.loyaltyTransaction.aggregate({
            where: {
                type: client_1.LoyaltyTransactionType.EARN,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: { points: true },
        });
        const redeemedAgg = await database_1.default.loyaltyTransaction.aggregate({
            where: {
                type: client_1.LoyaltyTransactionType.REDEEM,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: { points: true },
        });
        const pointsEarned = earnedAgg._sum.points || 0;
        const pointsRedeemed = redeemedAgg._sum.points || 0;
        const netGrowth = pointsEarned - pointsRedeemed;
        // Rebooking status distribution
        const now = new Date();
        const allClients = await database_1.default.client.findMany({
            where: { isActive: true },
            select: {
                id: true,
                lastVisitAt: true,
                appointments: {
                    select: { status: true, appointmentDate: true },
                    orderBy: { appointmentDate: 'desc' },
                    take: 1,
                },
            },
        });
        let due = 0;
        let overdue = 0;
        let lapsed = 0;
        let active = 0;
        for (const c of allClients) {
            // Determine last visit
            let lastVisit = c.lastVisitAt;
            if (!lastVisit && c.appointments.length > 0 && c.appointments[0].status === client_1.AppointmentStatus.COMPLETED) {
                lastVisit = c.appointments[0].appointmentDate;
            }
            if (!lastVisit) {
                continue; // Client never visited
            }
            const diffMs = now.getTime() - new Date(lastVisit).getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (days >= 90) {
                lapsed++;
            }
            else if (days >= 45) {
                overdue++;
            }
            else if (days >= 21) {
                due++;
            }
            else {
                active++;
            }
        }
        return {
            period,
            dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            acquisition: {
                newClients,
                returningClients,
                totalActiveClients,
            },
            loyalty: {
                pointsEarned,
                pointsRedeemed,
                netGrowth,
            },
            rebookingStatus: {
                due,
                overdue,
                lapsed,
                active,
            },
        };
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
//# sourceMappingURL=reports.service.js.map