import { z } from 'zod';
import { StockActivityType, RetailCategory } from '@prisma/client';

export const createStockSchema = z.object({
  name: z.string({ required_error: 'Stock item name is required' }).min(2, 'Name must be at least 2 characters'),
  category: z.string().optional(),
  quantity: z.number({ required_error: 'Quantity is required' }).nonnegative('Quantity cannot be negative'),
  unit: z.string({ required_error: 'Unit is required' }).min(1, 'Unit cannot be empty'),
});

export const refillStockSchema = z.object({
  quantity: z.number({ required_error: 'Refill quantity is required' }).positive('Quantity must be greater than 0'),
  reason: z.string().optional(),
});

export const updateStockSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const stockQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.union([z.string(), z.boolean()]).optional(),
  page: z.union([z.string(), z.number()]).optional(),
  limit: z.union([z.string(), z.number()]).optional(),
});

export const stockActivityQuerySchema = z.object({
  serviceStockId: z.string().uuid().optional(),
  type: z.nativeEnum(StockActivityType).optional(),
  date: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional(),
  limit: z.union([z.string(), z.number()]).optional(),
});

export const createRetailProductSchema = z.object({
  name: z.string({ required_error: 'Product name is required' }).min(2),
  category: z.nativeEnum(RetailCategory),
  price: z.number({ required_error: 'Price is required' }).positive('Price must be greater than 0'),
  quantity: z.number().int().nonnegative('Quantity must be 0 or more').default(0),
});

export const refillRetailSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});
