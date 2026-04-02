import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { TryCatch } from "../middleware/TryCatchHandler.js";

export const adminLogin = TryCatch(async (req: Request, res: Response) => {
      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
            return res.status(400).json({
                  success: false,
                  message: "Email and password are required",
                  error: true
            });
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (email !== adminEmail || password !== adminPassword) {
            return res.status(401).json({
                  success: false,
                  message: "Invalid credentials",
                  error: true
            });
      }

      const token = jwt.sign(
            { _id: "admin", email, role: "admin" },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
      );

      return res.status(200).json({
            success: true,
            message: "Admin login successful",
            error: false,
            data: { token }
      });
});
