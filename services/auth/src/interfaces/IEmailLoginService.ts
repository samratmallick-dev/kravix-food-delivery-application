import { User } from "../domain/entities/User.js";

export interface IEmailLoginService {
  login(email: string, password: string): Promise<User>;
}
