import jwt from "jsonwebtoken";
import { IUser } from "../model/User.js";

export interface TokenPayload {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string | null;
  restaurantId?: string;
}

export const generateToken = (user: IUser, extra: Partial<TokenPayload> = {}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const payload: TokenPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role ?? null,
    ...extra,
  };
  return jwt.sign(payload, secret, { expiresIn: "15d" });
};
