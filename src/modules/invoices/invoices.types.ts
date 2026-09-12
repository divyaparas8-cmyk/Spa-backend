import { InvoiceStatus, InvoiceItemType } from '@prisma/client';

export interface CreateInvoiceInput {
  appointmentId: string;
  discount?: number;
  status?: InvoiceStatus;
  retailProducts?: {
    retailProductId: string;
    quantity: number;
  }[];
}

export interface AddInvoiceItemInput {
  itemType: InvoiceItemType;
  retailProductId?: string;
  name?: string;
  price?: number;
  quantity: number;
}

export interface UpdateInvoiceInput {
  discount?: number;
  status?: InvoiceStatus;
}

export interface InvoiceQueryFilter {
  status?: InvoiceStatus;
  date?: string;
  clientId?: string;
  page?: number | string;
  limit?: number | string;
}

export interface AuthContextUser {
  id: string;
  role: string;
}
