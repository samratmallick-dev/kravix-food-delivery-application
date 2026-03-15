import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { User } from "../model/User.js";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { oauth2client } from "../config/google/google.js";

interface TokenPayload {
      _id: string;
      name: string;
      email: string;
      image: string;
      role: string | null;
}

const tokengenerator = (user: TokenPayload): string => {
      const secretkey = process.env.JWT_SECRET as string || "default_secret_key";

      const token = jwt.sign(user, secretkey, { expiresIn: "15d" });

      return token;
};

export const loginController = TryCatch(async (req: Request, res: Response) => {

      const { code } = req.body;

      if (!code) {
            return res.status(400).json({
                  success: false,
                  message: "Authorization code is required",
                  error: true
            });
      }

      const googleResponse = await oauth2client.getToken(code);

      oauth2client.setCredentials(googleResponse.tokens);

      const userResponse = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`);

      const { email, name, picture } = userResponse.data;

      let user = await User.findOne(
            { email }
      );

      if (!user) {
            user = await User.create({
                  email,
                  name,
                  image: picture
            })
      }

      const token = tokengenerator({
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role ?? null
      });

      return res.status(200).json({
            success: true,
            message: "Login successful",
            error: false,
            token,
            data: user
      });

});

const allowedRole = ["customer", "rider", "seller"] as const;

type AllowedRoleType = typeof allowedRole[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {

      const user = req.user;

      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized user",
                  error: true
            });
      }

      const { role } = req.body as { role: AllowedRoleType };

      if (!allowedRole.includes(role)) {
            return res.status(400).json({
                  success: false,
                  message: "Invalid role"
            });
      }

      const updateUser = await User.findByIdAndUpdate(
            user._id,
            { role },
            { new: true }
      );

      if (!updateUser) {
            return res.status(404).json({
                  success: false,
                  message: "User not found",
                  error: true
            });
      }

      const token = tokengenerator({
            _id: updateUser._id.toString(),
            name: updateUser.name,
            email: updateUser.email,
            image: updateUser.image,
            role: updateUser.role ?? null
      });

      return res.status(200).json({
            success: true,
            message: "Role Updated Successfully",
            token,
            data: updateUser
      });

});

export const getUserProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({
                  success: false,
                  message: "Unauthorized user",
                  error: true,
                  user: null
            });
      }
      const freshUser = await User.findById(user._id).lean();
      return res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            error: false,
            data: { ...freshUser, restaurantId: (user as any).restaurantId ?? null }
      });
});