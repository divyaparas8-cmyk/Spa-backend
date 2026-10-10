"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceQuerySchema = exports.updateInvoiceSchema = exports.addInvoiceItemSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createInvoiceSchema = zod_1.z.preprocess((val) => {
    if (val && typeof val === 'object') {
        if (val.appointmentId && typeof val.appointmentId === 'object') {
            const nested = val.appointmentId;
            return {
                ...nested,
                ...val,
                appointmentId: nested.appointmentId || nested.id || String(nested),
            };
        }
    }
    return val;
}, zod_1.z
    .object({
    appointmentId: zod_1.z.string().uuid('Invalid appointmentId UUID').optional().nullable(),
    clientId: zod_1.z.string().uuid('Invalid clientId UUID').optional().nullable(),
    clientName: zod_1.z.string().optional().nullable(),
    discount: zod_1.z.number().nonnegative('Discount cannot be negative').optional().default(0),
    status: zod_1.z.enum([client_1.InvoiceStatus.DRAFT, client_1.InvoiceStatus.PENDING_PAYMENT, client_1.InvoiceStatus.PAID]).optional().default(client_1.InvoiceStatus.PENDING_PAYMENT),
    paymentMethod: zod_1.z.enum(['CASH', 'MTN_MOMO', 'ORANGE_MONEY']).optional(),
    retailProducts: zod_1.z
        .array(zod_1.z.object({
        retailProductId: zod_1.z.string().uuid('Invalid retailProductId UUID'),
        quantity: zod_1.z.number().int().positive('Quantity must be a positive integer'),
    }))
        .optional(),
})
    .refine((data) => Boolean(data.appointmentId || (data.retailProducts && data.retailProducts.length > 0)), {
    message: 'Either appointmentId or at least one retailProduct must be provided',
}));
exports.addInvoiceItemSchema = zod_1.z.object({
    itemType: zod_1.z.nativeEnum(client_1.InvoiceItemType).optional().default(client_1.InvoiceItemType.RETAIL_PRODUCT),
    retailProductId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().optional(),
    price: zod_1.z.number().nonnegative().optional(),
    quantity: zod_1.z.number().int().positive('Quantity must be at least 1').default(1),
});
exports.updateInvoiceSchema = zod_1.z.object({
    discount: zod_1.z.number().nonnegative('Discount cannot be negative').optional(),
    status: zod_1.z.enum([client_1.InvoiceStatus.DRAFT, client_1.InvoiceStatus.PENDING_PAYMENT]).optional(),
});
exports.invoiceQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.InvoiceStatus).optional(),
    date: zod_1.z.string().optional(),
    clientId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    limit: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
});
//# sourceMappingURL=invoices.validation.js.map