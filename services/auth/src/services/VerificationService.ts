import crypto from "crypto";
import { IVerificationService } from "../interfaces/IVerificationService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { ValidationError } from "../utils/errors.js";

export class VerificationService implements IVerificationService {
  constructor(
    private userRepository: IUserRepository,
    private eventPublisher: IAuthEventPublisher
  ) {}

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user) {
      throw new ValidationError("Verification link is invalid or has expired.");
    }

    user.verifyEmail(token);
    await this.userRepository.update(user);
  }

  async resendVerification(email: string): Promise<void> {
    const normalizedEmail = email?.toLowerCase() ?? "";
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (user && !user.isEmailVerified) {
      const lastSentAt = user.emailVerificationExpiry
        ? user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000
        : 0;

      if (Date.now() - lastSentAt > 60 * 1000) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = rawToken;
        user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.userRepository.update(user);
        this.eventPublisher.publishVerificationEmail(normalizedEmail, user.name, rawToken);
      }
    }
  }
}
