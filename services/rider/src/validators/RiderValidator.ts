import { z } from "zod";

export const createRiderSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  aadhaarNumber: z.string().length(12),
  drivingLicesce: z.string().min(5),
  latitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))]),
  longitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))]),
  pictureUrl: z.string().optional()
});

export const updateRiderLocationSchema = z.object({
  latitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))]),
  longitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))]),
  orderId: z.string().min(1),
  customerUserId: z.string().min(1)
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  latitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))]),
  longitude: z.union([z.number(), z.string().transform((val) => parseFloat(val))])
});
