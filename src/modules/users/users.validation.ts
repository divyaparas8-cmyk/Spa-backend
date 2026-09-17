import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  password: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().optional(),
  password: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
