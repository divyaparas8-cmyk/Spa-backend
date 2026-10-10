import { z } from 'zod';
export declare const createInvoiceSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    appointmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    clientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    clientName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_PAYMENT", "PAID"]>>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["CASH", "MTN_MOMO", "ORANGE_MONEY"]>>;
    retailProducts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        retailProductId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        retailProductId: string;
        quantity: number;
    }, {
        retailProductId: string;
        quantity: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PENDING_PAYMENT" | "PAID";
    discount: number;
    clientId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    clientName?: string | null | undefined;
    paymentMethod?: "CASH" | "MTN_MOMO" | "ORANGE_MONEY" | undefined;
    retailProducts?: {
        retailProductId: string;
        quantity: number;
    }[] | undefined;
}, {
    status?: "DRAFT" | "PENDING_PAYMENT" | "PAID" | undefined;
    clientId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    clientName?: string | null | undefined;
    discount?: number | undefined;
    paymentMethod?: "CASH" | "MTN_MOMO" | "ORANGE_MONEY" | undefined;
    retailProducts?: {
        retailProductId: string;
        quantity: number;
    }[] | undefined;
}>, {
    status: "DRAFT" | "PENDING_PAYMENT" | "PAID";
    discount: number;
    clientId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    clientName?: string | null | undefined;
    paymentMethod?: "CASH" | "MTN_MOMO" | "ORANGE_MONEY" | undefined;
    retailProducts?: {
        retailProductId: string;
        quantity: number;
    }[] | undefined;
}, {
    status?: "DRAFT" | "PENDING_PAYMENT" | "PAID" | undefined;
    clientId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    clientName?: string | null | undefined;
    discount?: number | undefined;
    paymentMethod?: "CASH" | "MTN_MOMO" | "ORANGE_MONEY" | undefined;
    retailProducts?: {
        retailProductId: string;
        quantity: number;
    }[] | undefined;
}>, {
    status: "DRAFT" | "PENDING_PAYMENT" | "PAID";
    discount: number;
    clientId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    clientName?: string | null | undefined;
    paymentMethod?: "CASH" | "MTN_MOMO" | "ORANGE_MONEY" | undefined;
    retailProducts?: {
        retailProductId: string;
        quantity: number;
    }[] | undefined;
}, unknown>;
export declare const addInvoiceItemSchema: z.ZodObject<{
    itemType: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
        SERVICE: "SERVICE";
        RETAIL_PRODUCT: "RETAIL_PRODUCT";
    }>>>;
    retailProductId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    itemType: "SERVICE" | "RETAIL_PRODUCT";
    quantity: number;
    name?: string | undefined;
    price?: number | undefined;
    retailProductId?: string | undefined;
}, {
    name?: string | undefined;
    price?: number | undefined;
    retailProductId?: string | undefined;
    itemType?: "SERVICE" | "RETAIL_PRODUCT" | undefined;
    quantity?: number | undefined;
}>;
export declare const updateInvoiceSchema: z.ZodObject<{
    discount: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_PAYMENT"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "PENDING_PAYMENT" | undefined;
    discount?: number | undefined;
}, {
    status?: "DRAFT" | "PENDING_PAYMENT" | undefined;
    discount?: number | undefined;
}>;
export declare const invoiceQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<{
        DRAFT: "DRAFT";
        PENDING_PAYMENT: "PENDING_PAYMENT";
        PAID: "PAID";
    }>>;
    date: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    limit: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    limit?: string | number | undefined;
    search?: string | undefined;
    status?: "DRAFT" | "PENDING_PAYMENT" | "PAID" | undefined;
    clientId?: string | undefined;
    date?: string | undefined;
    page?: string | number | undefined;
}, {
    limit?: string | number | undefined;
    search?: string | undefined;
    status?: "DRAFT" | "PENDING_PAYMENT" | "PAID" | undefined;
    clientId?: string | undefined;
    date?: string | undefined;
    page?: string | number | undefined;
}>;
//# sourceMappingURL=invoices.validation.d.ts.map