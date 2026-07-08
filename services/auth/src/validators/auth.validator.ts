import { z } from "zod";
import { ValidationError } from "../utils/errors.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export const registrationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    email: z.string().regex(emailRegex, "Please provide a valid email address."),
    password: z.string().regex(passwordRegex, "Password must be at least 8 characters with one uppercase letter and one digit.")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().regex(emailRegex, "Please provide a valid email address."),
    password: z.string()
  })
});

export const profileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    image: z.string().optional()
  })
});

export const roleSchema = z.object({
  body: z.object({
    role: z.enum(["customer", "rider", "seller"])
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    newPassword: z.string().regex(passwordRegex, "Password must be at least 8 characters with one uppercase letter and one digit.")
  })
});

export class AuthValidator {
  static validateRegister(data: any) {
    const result = registrationSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid registration data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateLogin(data: any) {
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid login data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateProfileUpdate(data: any) {
    const result = profileUpdateSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid profile update data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateRole(data: any) {
    const result = roleSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid role selection";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateResetPassword(data: any) {
    const result = resetPasswordSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid password reset data";
      throw new ValidationError(msg);
    }
    return result.data;
  }
}
