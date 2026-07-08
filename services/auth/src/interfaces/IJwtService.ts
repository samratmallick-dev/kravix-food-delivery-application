import { User } from "../domain/entities/User.js";

export interface IJwtService {
  generateToken(user: User): string;
}
