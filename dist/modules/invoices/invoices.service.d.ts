import { Prisma } from '@prisma/client';
import { CreateInvoiceInput, AddInvoiceItemInput, UpdateInvoiceInput, InvoiceQueryFilter, AuthContextUser } from './invoices.types';
export declare class InvoicesService {
    createInvoice(data: CreateInvoiceInput, authUser: AuthContextUser): Promise<{
        notes: string | null;
        paidAmount: number;
        remainingAmount: number;
        client: {
            id: string;
            phone: string;
            name: string;
            whatsapp: string | null;
            quartier: string | null;
        } | null;
        appointment: {
            id: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            appointmentDate: Date;
            appointmentTime: string;
            serviceSummary: string | null;
            notes: string | null;
        } | null;
        items: ({
            retailProduct: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.RetailCategory;
                quantity: number;
            } | null;
            technician: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serviceId: string | null;
            technicianId: string | null;
            price: Prisma.Decimal;
            invoiceId: string;
            appointmentServiceId: string | null;
            retailProductId: string | null;
            itemType: import(".prisma/client").$Enums.InvoiceItemType;
            productName: string | null;
            quantity: number;
        })[];
        payments: ({
            receivedBy: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            invoiceId: string;
            paidAt: Date;
            amount: Prisma.Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            receivedById: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        clientId: string | null;
        appointmentId: string | null;
        total: Prisma.Decimal;
        date: Date;
        invoiceNumber: string;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal;
        pointsEarned: number;
        pointsRedeemed: number;
    }>;
    addInvoiceItem(invoiceId: string, data: AddInvoiceItemInput, authUser: AuthContextUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        serviceId: string | null;
        technicianId: string | null;
        price: Prisma.Decimal;
        invoiceId: string;
        appointmentServiceId: string | null;
        retailProductId: string | null;
        itemType: import(".prisma/client").$Enums.InvoiceItemType;
        productName: string | null;
        quantity: number;
    }>;
    getInvoices(query: InvoiceQueryFilter): Promise<{
        invoices: {
            notes: string | null;
            paidAmount: number;
            remainingAmount: number;
            client: {
                id: string;
                phone: string;
                name: string;
                quartier: string | null;
            } | null;
            appointment: {
                id: string;
                appointmentDate: Date;
                appointmentTime: string;
                serviceSummary: string | null;
                notes: string | null;
            } | null;
            items: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                serviceId: string | null;
                technicianId: string | null;
                price: Prisma.Decimal;
                invoiceId: string;
                appointmentServiceId: string | null;
                retailProductId: string | null;
                itemType: import(".prisma/client").$Enums.InvoiceItemType;
                productName: string | null;
                quantity: number;
            }[];
            payments: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                invoiceId: string;
                paidAt: Date;
                amount: Prisma.Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
                receivedById: string;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            clientId: string | null;
            appointmentId: string | null;
            total: Prisma.Decimal;
            date: Date;
            invoiceNumber: string;
            subtotal: Prisma.Decimal;
            discount: Prisma.Decimal;
            pointsEarned: number;
            pointsRedeemed: number;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPendingInvoices(): Promise<{
        invoices: {
            notes: string | null;
            paidAmount: number;
            remainingAmount: number;
            client: {
                id: string;
                phone: string;
                name: string;
                quartier: string | null;
            } | null;
            appointment: {
                id: string;
                appointmentDate: Date;
                appointmentTime: string;
                serviceSummary: string | null;
                notes: string | null;
            } | null;
            items: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                serviceId: string | null;
                technicianId: string | null;
                price: Prisma.Decimal;
                invoiceId: string;
                appointmentServiceId: string | null;
                retailProductId: string | null;
                itemType: import(".prisma/client").$Enums.InvoiceItemType;
                productName: string | null;
                quantity: number;
            }[];
            payments: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                invoiceId: string;
                paidAt: Date;
                amount: Prisma.Decimal;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
                receivedById: string;
            }[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            clientId: string | null;
            appointmentId: string | null;
            total: Prisma.Decimal;
            date: Date;
            invoiceNumber: string;
            subtotal: Prisma.Decimal;
            discount: Prisma.Decimal;
            pointsEarned: number;
            pointsRedeemed: number;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getInvoiceById(id: string): Promise<{
        notes: string | null;
        paidAmount: number;
        remainingAmount: number;
        client: {
            id: string;
            phone: string;
            name: string;
            whatsapp: string | null;
            quartier: string | null;
        } | null;
        appointment: {
            id: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            appointmentDate: Date;
            appointmentTime: string;
            serviceSummary: string | null;
            notes: string | null;
        } | null;
        items: ({
            retailProduct: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.RetailCategory;
                quantity: number;
            } | null;
            technician: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serviceId: string | null;
            technicianId: string | null;
            price: Prisma.Decimal;
            invoiceId: string;
            appointmentServiceId: string | null;
            retailProductId: string | null;
            itemType: import(".prisma/client").$Enums.InvoiceItemType;
            productName: string | null;
            quantity: number;
        })[];
        payments: ({
            receivedBy: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            invoiceId: string;
            paidAt: Date;
            amount: Prisma.Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            receivedById: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        clientId: string | null;
        appointmentId: string | null;
        total: Prisma.Decimal;
        date: Date;
        invoiceNumber: string;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal;
        pointsEarned: number;
        pointsRedeemed: number;
    }>;
    updateInvoice(id: string, data: UpdateInvoiceInput, authUser: AuthContextUser): Promise<{
        notes: string | null;
        paidAmount: number;
        remainingAmount: number;
        client: {
            id: string;
            phone: string;
            name: string;
            whatsapp: string | null;
            quartier: string | null;
        } | null;
        appointment: {
            id: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            appointmentDate: Date;
            appointmentTime: string;
            serviceSummary: string | null;
            notes: string | null;
        } | null;
        items: ({
            retailProduct: {
                id: string;
                name: string;
                category: import(".prisma/client").$Enums.RetailCategory;
                quantity: number;
            } | null;
            technician: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            serviceId: string | null;
            technicianId: string | null;
            price: Prisma.Decimal;
            invoiceId: string;
            appointmentServiceId: string | null;
            retailProductId: string | null;
            itemType: import(".prisma/client").$Enums.InvoiceItemType;
            productName: string | null;
            quantity: number;
        })[];
        payments: ({
            receivedBy: {
                staffProfile: {
                    name: string;
                } | null;
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            invoiceId: string;
            paidAt: Date;
            amount: Prisma.Decimal;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            receivedById: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        clientId: string | null;
        appointmentId: string | null;
        total: Prisma.Decimal;
        date: Date;
        invoiceNumber: string;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal;
        pointsEarned: number;
        pointsRedeemed: number;
    }>;
}
export declare const invoicesService: InvoicesService;
//# sourceMappingURL=invoices.service.d.ts.map