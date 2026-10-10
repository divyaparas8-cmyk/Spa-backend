import { z } from 'zod';
export declare const dateRangeQuerySchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<["today", "weekly", "monthly", "custom"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}>;
export declare const topServicesQuerySchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<["today", "weekly", "monthly", "custom"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
} & {
    limit: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    limit?: string | number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}, {
    limit?: string | number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}>;
export declare const technicianReportQuerySchema: z.ZodObject<{
    period: z.ZodOptional<z.ZodEnum<["today", "weekly", "monthly", "custom"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
} & {
    technicianId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    technicianId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}, {
    technicianId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    period?: "custom" | "today" | "weekly" | "monthly" | undefined;
}>;
//# sourceMappingURL=reports.validation.d.ts.map