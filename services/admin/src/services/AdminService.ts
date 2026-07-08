import jwt from "jsonwebtoken";
import { IAdminService } from "../interfaces/IAdminService.js";
import { AuthenticationError, ValidationError } from "../utils/errors.js";

export class AdminService implements IAdminService {
  async login(email?: string, password?: string): Promise<string> {
    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      throw new AuthenticationError("Invalid credentials");
    }

    const token = jwt.sign(
      { _id: "admin", email, role: "admin" },
      process.env.JWT_SECRET as string,
      { expiresIn: "15d" }
    );

    return token;
  }
}
