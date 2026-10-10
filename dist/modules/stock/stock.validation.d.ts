import { z } from 'zod';
export declare const createStockSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    unit: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    unit: string;
    category?: string | undefined;
}, {
    name: string;
    quantity: number;
    unit: string;
    category?: string | undefined;
}>;
export declare const refillStockSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    reason?: string | undefined;
}, {
    quantity: number;
    reason?: string | undefined;
}>;
export declare const updateStockSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    category?: string | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    category?: string | undefined;
    quantity?: number | undefined;
    unit?: string | undefined;
}>;
export declare const stockQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodBoolean]>>;
    page: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    limit: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    limit?: string | number | undefined;
    search?: string | undefined;
    isActive?: string | boolean | undefined;
    category?: string | undefined;
    page?: string | number | undefined;
}, {
    limit?: string | number | undefined;
    search?: string | undefined;
    isActive?: string | boolean | undefined;
    category?: string | undefined;
    page?: string | number | undefined;
}>;
export declare const stockActivityQuerySchema: z.ZodObject<{
    serviceStockId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<{
        REFILL: "REFILL";
        ADJUSTMENT: "ADJUSTMENT";
        CONSUMPTION: "CONSUMPTION";
        SERVICE_USAGE: "SERVICE_USAGE";
        DAMAGE: "DAMAGE";
    }>>;
    date: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    limit: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    limit?: string | number | undefined;
    type?: "REFILL" | "ADJUSTMENT" | "CONSUMPTION" | "SERVICE_USAGE" | "DAMAGE" | undefined;
    date?: string | undefined;
    page?: string | number | undefined;
    serviceStockId?: string | undefined;
}, {
    limit?: string | number | undefined;
    type?: "REFILL" | "ADJUSTMENT" | "CONSUMPTION" | "SERVICE_USAGE" | "DAMAGE" | undefined;
    date?: string | undefined;
    page?: string | number | undefined;
    serviceStockId?: string | undefined;
}>;
export declare const createRetailProductSchema: z.ZodObject<{
    barcode: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    category: z.ZodNativeEnum<{
        DRINKS: "DRINKS";
        COSMETICS: "COSMETICS";
    }>;
    price: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    category: "DRINKS" | "COSMETICS";
    quantity: number;
    barcode?: string | undefined;
}, {
    name: string;
    price: number;
    category: "DRINKS" | "COSMETICS";
    quantity?: number | undefined;
    barcode?: string | undefined;
}>;
export declare const updateRetailProductSchema: z.ZodObject<{
    barcode: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    price?: number | undefined;
    quantity?: number | undefined;
    barcode?: string | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    price?: number | undefined;
    quantity?: number | undefined;
    barcode?: string | undefined;
}>;
export declare const refillRetailSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
export declare const deductRetailStockSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        productId: string;
    }, {
        quantity: number;
        productId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        quantity: number;
        productId: string;
    }[];
}, {
    items: {
        quantity: number;
        productId: string;
    }[];
}>;
//# sourceMappingURL=stock.validation.d.ts.map