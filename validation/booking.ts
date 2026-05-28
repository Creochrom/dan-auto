import { z } from "zod"

export const bookingSchema = z.object({
  customerName: z.string().min(2).max(100),

  customerPhone: z.string().min(5).max(30),

  customerEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal("")),

  registration: z.string().min(2).max(20),

  service: z.string().min(2).max(100),

  notes: z.string().max(2000).optional(),
})