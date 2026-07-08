import bcrypt from "bcryptjs";
import { IEmailLoginService } from "../interfaces/IEmailLoginService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { User } from "../domain/entities/User.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";

export class EmailLoginService implements IEmailLoginService {
  constructor(private userRepository: IUserRepository) {}

  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email?.toLowerCase() ?? "";
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AuthenticationError("Account does not exist. Please register first.");
    }

    if (!user.authProviders.includes("email")) {
      throw new AuthorizationError("This account is not registered with Email login. Please use Google Sign-In.");
    }

    if (!user.isEmailVerified) {
      throw new AuthorizationError("Please verify your email before signing in.", "EMAIL_NOT_VERIFIED");
    }

    user.checkNotBlocked();

    const match = await bcrypt.compare(password ?? "", user.passwordHash ?? "");
    if (!match) {
      throw new AuthenticationError("Invalid email or password.");
    }

    return user;
  }
}
