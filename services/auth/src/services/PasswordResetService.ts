import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IPasswordResetService } from "../interfaces/IPasswordResetService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { ValidationError } from "../utils/errors.js";

export class PasswordResetService implements IPasswordResetService {
  constructor(
    private userRepository: IUserRepository,
    private eventPublisher: IAuthEventPublisher
  ) {}

  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email?.toLowerCase() ?? "";
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (user && user.authProviders.includes("email") && user.isEmailVerified) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.passwordResetToken = hashedToken;
      user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await this.userRepository.update(user);
      this.eventPublisher.publishPasswordResetEmail(normalizedEmail, user.name, rawToken);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token) {
      throw new ValidationError("Password reset link is invalid or has expired.");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await this.userRepository.findByResetToken(hashedToken);

    if (!user || !user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      throw new ValidationError("Password reset link is invalid or has expired.");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;

    await this.userRepository.update(user);
  }
}
