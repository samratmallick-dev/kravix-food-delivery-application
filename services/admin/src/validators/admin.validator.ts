import { z } from "zod";
import { ValidationError } from "../utils/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const verifySchema = z.object({
  isVerified: z.boolean().optional()
});

export class AdminValidator {
  static validateLogin(data: any) {
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid login data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateVerify(data: any) {
    const result = verifySchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid verify payload";
      throw new ValidationError(msg);
    }
    return result.data;
  }
}
