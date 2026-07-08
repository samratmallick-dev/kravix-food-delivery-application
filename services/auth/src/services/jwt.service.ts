import jwt from "jsonwebtoken";
import { User } from "../domain/entities/User.js";
import { IJwtService } from "../interfaces/IJwtService.js";

export interface TokenPayload {
  _id: string;
  name: string;
  email: string;
  image: string;
  role: string | null;
  restaurantId: string | null;
}

export class JwtService implements IJwtService {
  generateToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set");
    }
    const payload: TokenPayload = {
      _id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      restaurantId: user.restaurantId ?? null
    };
    return jwt.sign(payload, secret, { expiresIn: "15d" });
  }
}
