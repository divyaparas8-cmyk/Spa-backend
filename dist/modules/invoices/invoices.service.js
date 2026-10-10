"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesService = exports.InvoicesService = void 0;
const loyalty_service_1 = require("../loyalty/loyalty.service");
const commissions_service_1 = require("../commissions/commissions.service");
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
class InvoicesService {
    async createInvoice(data, authUser) {
        const isRetailOnly = !data.appointmentId;
        let appointment = null;
        let billableServices = [];
        let subtotal = 0;
        if (!isRetailOnly) {
            // 1. Fetch appointment with client and appointmentServices
            appointment = await database_1.default.appointment.findUnique({
                where: { id: data.appointmentId },
                include: {
                    client: true,
                    appointmentServices: {
                        include: {
                            service: true,
                            technician: {
                                include: { staffProfile: true },
                            },
                        },
                    },
                },
            });
            if (!appointment) {
                throw new errorHandler_1.AppError('Appointment not found', constants_1.HTTP_STATUS.NOT_FOUND);
            }
            // 2. Prevent duplicate invoice for same appointment
            const existingInvoice = await database_1.default.invoice.findUnique({
                where: { appointmentId: data.appointmentId },
            });
            if (existingInvoice) {
                throw new errorHandler_1.AppError('Invoice already exists for this appointment', constants_1.HTTP_STATUS.CONFLICT);
            }
            // 3. Create invoice from non-cancelled appointment services
            billableServices = appointment.appointmentServices.filter((s) => s.status === client_1.AppointmentServiceStatus.COMPLETED);
            if (billableServices.length === 0) {
                billableServices = appointment.appointmentServices.filter((s) => s.status !== client_1.AppointmentServiceStatus.CANCELLED);
            }
            if (billableServices.length === 0 && (!data.retailProducts || data.retailProducts.length === 0)) {
                throw new errorHandler_1.AppError('Cannot create invoice: no billable appointment services found for this visit', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
            // Calculate subtotal from billable services
            subtotal = billableServices.reduce((sum, s) => sum + Number(s.price), 0);
        }
        else {
            if (!data.retailProducts || data.retailProducts.length === 0) {
                throw new errorHandler_1.AppError('Cannot create retail invoice: at least one retail product is required', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        }
        const invoiceStatus = data.status || (isRetailOnly ? client_1.InvoiceStatus.PAID : client_1.InvoiceStatus.PENDING_PAYMENT);
        // 4. Atomic invoice creation with retry-based unique number generation.
        // Scopes count to today's date prefix and retries on P2002 (unique constraint collision).
        const MAX_RETRIES = 5;
        let lastError = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const dateObj = new Date();
                const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
                const prefix = `INV-${dateStr}-`;
                // Count only invoices with today's date prefix for a tighter sequence
                const todayCount = await database_1.default.invoice.count({
                    where: { invoiceNumber: { startsWith: prefix } },
                });
                const invoiceNumber = `${prefix}${String(todayCount + 1 + attempt).padStart(4, '0')}`;
                const invoice = await database_1.default.$transaction(async (tx) => {
                    // Process retail products if requested
                    let retailSubtotal = 0;
                    const retailItemsToCreate = [];
                    if (data.retailProducts && data.retailProducts.length > 0) {
                        for (const rp of data.retailProducts) {
                            const product = await tx.retailProduct.findUnique({
                                where: { id: rp.retailProductId },
                            });
                            if (!product || !product.isActive) {
                                throw new errorHandler_1.AppError(`Retail product not found or inactive (${rp.retailProductId})`, constants_1.HTTP_STATUS.NOT_FOUND);
                            }
                            if (product.quantity < rp.quantity) {
                                throw new errorHandler_1.AppError(`Insufficient stock for retail product "${product.name}" (requested: ${rp.quantity}, available: ${product.quantity})`, constants_1.HTTP_STATUS.BAD_REQUEST);
                            }
                            // Decrement RetailProduct stock
                            await tx.retailProduct.update({
                                where: { id: product.id },
                                data: {
                                    quantity: {
                                        decrement: rp.quantity,
                                    },
                                },
                            });
                            const itemTotal = Number(product.price) * rp.quantity;
                            retailSubtotal += itemTotal;
                            retailItemsToCreate.push({
                                retailProductId: product.id,
                                itemType: client_1.InvoiceItemType.RETAIL_PRODUCT,
                                name: product.name,
                                productName: product.name,
                                price: product.price,
                                quantity: rp.quantity,
                            });
                        }
                    }
                    const combinedSubtotal = subtotal + retailSubtotal;
                    const discount = data.discount || 0;
                    const total = Math.max(0, combinedSubtotal - discount);
                    const targetClientId = appointment ? appointment.clientId : (data.clientId || null);
                    const created = await tx.invoice.create({
                        data: {
                            appointmentId: appointment ? appointment.id : null,
                            clientId: targetClientId,
                            invoiceNumber,
                            date: dateObj,
                            status: invoiceStatus,
                            subtotal: combinedSubtotal,
                            discount,
                            total,
                        },
                    });
                    if (appointment) {
                        // Ensure billed appointment services and appointment are marked COMPLETED
                        await tx.appointmentService.updateMany({
                            where: {
                                appointmentId: appointment.id,
                                status: { in: [client_1.AppointmentServiceStatus.BOOKED, client_1.AppointmentServiceStatus.IN_PROGRESS] },
                            },
                            data: {
                                status: client_1.AppointmentServiceStatus.COMPLETED,
                                completedAt: new Date(),
                            },
                        });
                        await tx.appointment.update({
                            where: { id: appointment.id },
                            data: { status: client_1.AppointmentStatus.COMPLETED },
                        });
                        // Snapshot service items
                        for (const s of billableServices) {
                            await tx.invoiceItem.create({
                                data: {
                                    invoiceId: created.id,
                                    appointmentServiceId: s.id,
                                    serviceId: s.serviceId,
                                    technicianId: s.technicianId,
                                    itemType: client_1.InvoiceItemType.SERVICE,
                                    name: s.service?.name || 'Spa Service',
                                    price: s.price,
                                    quantity: 1,
                                },
                            });
                        }
                    }
                    // Snapshot retail product items
                    for (const rItem of retailItemsToCreate) {
                        await tx.invoiceItem.create({
                            data: {
                                invoiceId: created.id,
                                ...rItem,
                            },
                        });
                    }
                    // If status is PAID and paymentMethod is provided, create payment record
                    if (invoiceStatus === client_1.InvoiceStatus.PAID && data.paymentMethod) {
                        await tx.payment.create({
                            data: {
                                invoiceId: created.id,
                                amount: total,
                                paymentMethod: data.paymentMethod,
                                receivedById: authUser.id,
                                paidAt: dateObj,
                                notes: isRetailOnly ? 'Retail sale paid at reception' : 'Invoice payment recorded',
                            },
                        });
                    }
                    // Log ClientHistory if client linked
                    if (targetClientId) {
                        const totalItems = billableServices.length + retailItemsToCreate.length;
                        await tx.clientHistory.create({
                            data: {
                                clientId: targetClientId,
                                action: 'INVOICE_CREATED',
                                details: `Invoice ${invoiceNumber} created (${totalItems} items). Total: ${total} FCFA`,
                                performedBy: authUser.id,
                            },
                        });
                    }
                    return created;
                });
                return this.getInvoiceById(invoice.id);
            }
            catch (err) {
                // Retry on Prisma unique constraint violation (P2002) for invoiceNumber
                if (err?.code === 'P2002' && attempt < MAX_RETRIES - 1) {
                    lastError = err;
                    continue;
                }
                throw err;
            }
        }
        // All retries exhausted (should not happen in practice)
        throw lastError || new errorHandler_1.AppError('Failed to generate unique invoice number', constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    async addInvoiceItem(invoiceId, data, authUser) {
        const invoice = await database_1.default.invoice.findUnique({
            where: { id: invoiceId },
            include: { items: true },
        });
        if (!invoice) {
            throw new errorHandler_1.AppError('Invoice not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            throw new errorHandler_1.AppError('Cannot add items to a PAID invoice', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        return database_1.default.$transaction(async (tx) => {
            let itemPrice = data.price || 0;
            let itemName = data.name || '';
            if (data.itemType === client_1.InvoiceItemType.RETAIL_PRODUCT && data.retailProductId) {
                const product = await tx.retailProduct.findUnique({
                    where: { id: data.retailProductId },
                });
                if (!product || !product.isActive) {
                    throw new errorHandler_1.AppError('Retail product not found or inactive', constants_1.HTTP_STATUS.NOT_FOUND);
                }
                if (product.quantity < data.quantity) {
                    throw new errorHandler_1.AppError(`Insufficient stock for retail product "${product.name}" (requested: ${data.quantity}, available: ${product.quantity})`, constants_1.HTTP_STATUS.BAD_REQUEST);
                }
                // Decrement RetailProduct stock
                await tx.retailProduct.update({
                    where: { id: product.id },
                    data: {
                        quantity: {
                            decrement: data.quantity,
                        },
                    },
                });
                itemPrice = Number(product.price);
                itemName = product.name;
            }
            const itemTotal = itemPrice * data.quantity;
            const newSubtotal = Number(invoice.subtotal) + itemTotal;
            const newTotal = Math.max(0, newSubtotal - Number(invoice.discount));
            const createdItem = await tx.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    retailProductId: data.retailProductId || null,
                    itemType: data.itemType,
                    name: itemName,
                    productName: data.retailProductId ? itemName : null,
                    price: new client_1.Prisma.Decimal(itemPrice),
                    quantity: data.quantity,
                },
            });
            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    subtotal: newSubtotal,
                    total: newTotal,
                },
            });
            if (invoice.clientId) {
                await tx.clientHistory.create({
                    data: {
                        clientId: invoice.clientId,
                        action: 'INVOICE_UPDATED',
                        details: `Item "${itemName}" added to Invoice ${invoice.invoiceNumber}. New total: ${newTotal} FCFA`,
                        performedBy: authUser.id,
                    },
                });
            }
            return createdItem;
        });
    }
    async getInvoices(query) {
        const page = Math.max(1, parseInt(String(query.page || 1), 10));
        const limit = Math.max(1, Math.min(1000, parseInt(String(query.limit || 20), 10)));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.clientId)
            where.clientId = query.clientId;
        if (query.date)
            where.date = new Date(query.date);
        if (query.search && query.search.trim()) {
            const s = query.search.trim();
            where.OR = [
                { invoiceNumber: { contains: s, mode: 'insensitive' } },
                { client: { name: { contains: s, mode: 'insensitive' } } },
                { client: { phone: { contains: s, mode: 'insensitive' } } },
            ];
        }
        const [total, invoices] = await Promise.all([
            database_1.default.invoice.count({ where }),
            database_1.default.invoice.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: {
                        select: { id: true, name: true, phone: true, quartier: true },
                    },
                    appointment: {
                        select: { id: true, notes: true, appointmentDate: true, appointmentTime: true, serviceSummary: true },
                    },
                    items: true,
                    payments: true,
                },
            }),
        ]);
        const formatted = invoices.map((inv) => {
            const paidAmount = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const remainingAmount = Math.max(0, Number(inv.total) - paidAmount);
            return {
                ...inv,
                notes: inv.appointment?.notes || null,
                paidAmount,
                remainingAmount,
            };
        });
        return {
            invoices: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getPendingInvoices() {
        return this.getInvoices({ status: client_1.InvoiceStatus.PENDING_PAYMENT, limit: 100 });
    }
    async getInvoiceById(id) {
        const invoice = await database_1.default.invoice.findUnique({
            where: { id },
            include: {
                client: {
                    select: { id: true, name: true, phone: true, whatsapp: true, quartier: true },
                },
                appointment: {
                    select: { id: true, notes: true, appointmentDate: true, appointmentTime: true, status: true, serviceSummary: true },
                },
                items: {
                    include: {
                        technician: {
                            select: { id: true, email: true, staffProfile: { select: { name: true } } },
                        },
                        retailProduct: {
                            select: { id: true, name: true, category: true, quantity: true },
                        },
                    },
                },
                payments: {
                    include: {
                        receivedBy: {
                            select: { id: true, email: true, staffProfile: { select: { name: true } } },
                        },
                    },
                    orderBy: { paidAt: 'asc' },
                },
            },
        });
        if (!invoice) {
            throw new errorHandler_1.AppError('Invoice not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remainingAmount = Math.max(0, Number(invoice.total) - paidAmount);
        return {
            ...invoice,
            notes: invoice.appointment?.notes || null,
            paidAmount,
            remainingAmount,
        };
    }
    async updateInvoice(id, data, authUser) {
        const invoice = await database_1.default.invoice.findUnique({ where: { id } });
        if (!invoice) {
            throw new errorHandler_1.AppError('Invoice not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            throw new errorHandler_1.AppError('Cannot update a PAID invoice', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const updateData = {};
        if (data.status)
            updateData.status = data.status;
        if (data.discount !== undefined) {
            updateData.discount = data.discount;
            updateData.total = Math.max(0, Number(invoice.subtotal) - data.discount);
        }
        const updated = await database_1.default.invoice.update({
            where: { id },
            data: updateData,
        });
        if (data.status === client_1.InvoiceStatus.PAID) {
            await commissions_service_1.commissionsService.generateCommissionsForInvoice(updated.id);
            await loyalty_service_1.loyaltyService.awardPointsForInvoice(updated.id);
        }
        if (invoice.clientId) {
            await database_1.default.clientHistory.create({
                data: {
                    clientId: invoice.clientId,
                    action: 'INVOICE_UPDATED',
                    details: `Invoice ${invoice.invoiceNumber} updated by ${authUser.role}`,
                    performedBy: authUser.id,
                },
            });
        }
        return this.getInvoiceById(updated.id);
    }
}
exports.InvoicesService = InvoicesService;
exports.invoicesService = new InvoicesService();
//# sourceMappingURL=invoices.service.js.map