import { User } from "../domain/entities/User.js";

export interface IGoogleLoginService {
  loginWithGoogle(code: string): Promise<User>;
}
