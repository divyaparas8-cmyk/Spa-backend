import { Prisma } from '@prisma/client';
import { CommissionQueryFilter, AddBonusInput, AdjustCommissionInput, SetCommissionRuleInput, AuthContextUser } from './commissions.types';
export declare class CommissionsService {
    /**
     * Automatically calculates and generates technician commissions for a PAID invoice.
     * - Only executes if invoice status === PAID.
     * - Idempotent: Prevents duplicate commission generation.
     * - Calculates based on the actual technician assigned to each service item.
     * - Supports service-wise commission percentages.
     * - Also generates employee referral commissions if applicable.
     */
    generateCommissionsForInvoice(invoiceId: string, txClient?: Prisma.TransactionClient): Promise<void>;
    /**
     * Generates EmployeeCommission for the employee who introduced the client.
     * - Looks up client.introducedByEmployeeId from the invoice's client.
     * - Applies REFERRAL commission rules from CommissionRule table.
     * - Idempotent: Skips if EmployeeCommission already exists for this invoice.
     * - The referring employee must NOT be a MANAGER (Managers cannot earn referral commissions).
     */
    private generateEmployeeReferralCommission;
    /**
     * Get commissions list with filtering, summary stats, and RBAC enforcement.
     * TECHNICIAN: Automatically scoped to their own commissions only.
     */
    getCommissions(query: CommissionQueryFilter, authUser: AuthContextUser): Promise<{
        commissions: {
            servicePrice: number;
            commissionRate: number;
            baseCommission: number;
            bonusAmount: number;
            totalCommission: number;
            activities: {
                amount: number;
                previousTotal: number | null;
                newTotal: number | null;
                performedBy: {
                    staffProfile: {
                        name: string;
                    } | null;
                    id: string;
                    email: string;
                } | null;
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.CommissionActivityType;
                reason: string | null;
                technicianCommissionId: string;
                performedById: string | null;
            }[];
            invoice: {
                id: string;
                status: import(".prisma/client").$Enums.InvoiceStatus;
                total: Prisma.Decimal;
                date: Date;
                invoiceNumber: string;
            };
            technician: {
                staffProfile: {
                    phone: string | null;
                    name: string;
                } | null;
                id: string;
                email: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CommissionStatus;
            notes: string | null;
            serviceId: string | null;
            technicianId: string;
            invoiceId: string;
            appointmentServiceId: string | null;
            serviceCategory: string | null;
            serviceName: string;
            approvedAt: Date | null;
            approvedById: string | null;
        }[];
        summary: {
            totalBaseCommission: number;
            totalBonusAmount: number;
            totalEarned: number;
            totalApproved: number;
            totalPending: number;
        };
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get specific technician commission report.
     * TECHNICIAN: Blocked with 403 Forbidden if requesting another technician's report.
     */
    getTechnicianCommissions(technicianId: string, query: CommissionQueryFilter, authUser: AuthContextUser): Promise<{
        commissions: {
            servicePrice: number;
            commissionRate: number;
            baseCommission: number;
            bonusAmount: number;
            totalCommission: number;
            activities: {
                amount: number;
                previousTotal: number | null;
                newTotal: number | null;
                performedBy: {
                    staffProfile: {
                        name: string;
                    } | null;
                    id: string;
                    email: string;
                } | null;
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.CommissionActivityType;
                reason: string | null;
                technicianCommissionId: string;
                performedById: string | null;
            }[];
            invoice: {
                id: string;
                status: import(".prisma/client").$Enums.InvoiceStatus;
                total: Prisma.Decimal;
                date: Date;
                invoiceNumber: string;
            };
            technician: {
                staffProfile: {
                    phone: string | null;
                    name: string;
                } | null;
                id: string;
                email: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CommissionStatus;
            notes: string | null;
            serviceId: string | null;
            technicianId: string;
            invoiceId: string;
            appointmentServiceId: string | null;
            serviceCategory: string | null;
            serviceName: string;
            approvedAt: Date | null;
            approvedById: string | null;
        }[];
        summary: {
            totalBaseCommission: number;
            totalBonusAmount: number;
            totalEarned: number;
            totalApproved: number;
            totalPending: number;
        };
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        technician: {
            id: string;
            email: string;
            name: string;
            phone: string | null;
        };
    }>;
    /**
     * Manager adds a performance bonus to a technician's commission record.
     * Logs CommissionActivity with BONUS_ADDED.
     */
    addBonus(commissionId: string, input: AddBonusInput, authUser: AuthContextUser): Promise<{
        servicePrice: number;
        commissionRate: number;
        baseCommission: number;
        bonusAmount: number;
        totalCommission: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CommissionStatus;
        notes: string | null;
        serviceId: string | null;
        technicianId: string;
        invoiceId: string;
        appointmentServiceId: string | null;
        serviceCategory: string | null;
        serviceName: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    /**
     * Manager adjusts commission amount or rate with mandatory reason.
     * Logs CommissionActivity with ADJUSTED.
     */
    adjustCommission(commissionId: string, input: AdjustCommissionInput, authUser: AuthContextUser): Promise<{
        servicePrice: number;
        commissionRate: number;
        baseCommission: number;
        bonusAmount: number;
        totalCommission: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CommissionStatus;
        notes: string | null;
        serviceId: string | null;
        technicianId: string;
        invoiceId: string;
        appointmentServiceId: string | null;
        serviceCategory: string | null;
        serviceName: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    /**
     * Manager approves commission record.
     * Logs CommissionActivity with APPROVED.
     */
    approveCommission(commissionId: string, authUser: AuthContextUser): Promise<{
        servicePrice: number;
        commissionRate: number;
        baseCommission: number;
        bonusAmount: number;
        totalCommission: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CommissionStatus;
        notes: string | null;
        serviceId: string | null;
        technicianId: string;
        invoiceId: string;
        appointmentServiceId: string | null;
        serviceCategory: string | null;
        serviceName: string;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    /**
     * Manager sets/updates service-wise commission rules.
     */
    setCommissionRule(input: SetCommissionRuleInput): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CommissionType;
        percentage: Prisma.Decimal;
        fixedAmount: Prisma.Decimal | null;
        serviceCategory: string | null;
    }>;
    getCommissionRules(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.CommissionType;
        percentage: Prisma.Decimal;
        fixedAmount: Prisma.Decimal | null;
        serviceCategory: string | null;
    }[]>;
}
export declare const commissionsService: CommissionsService;
//# sourceMappingURL=commissions.service.d.ts.map