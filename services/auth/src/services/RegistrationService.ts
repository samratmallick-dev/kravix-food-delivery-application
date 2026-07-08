import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IRegistrationService } from "../interfaces/IRegistrationService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { ConflictError } from "../utils/errors.js";
import { UserFactory } from "../factories/user.factory.js";

export class RegistrationService implements IRegistrationService {
  constructor(
    private userRepository: IUserRepository,
    private eventPublisher: IAuthEventPublisher
  ) {}

  async register(name: string, email: string, password: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);

    if (existing) {
      if (existing.isEmailVerified && existing.authProviders.includes("google") && !existing.authProviders.includes("email")) {
        const passwordHash = await bcrypt.hash(password, 10);
        const rawToken = crypto.randomBytes(32).toString("hex");
        existing.authProviders.push("email");
        existing.passwordHash = passwordHash;
        existing.isEmailVerified = false;
        existing.emailVerificationToken = rawToken;
        existing.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.userRepository.update(existing);
        this.eventPublisher.publishVerificationEmail(normalizedEmail, existing.name, rawToken);
        return;
      }
      throw new ConflictError("This email is already registered. Please sign in instead.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = UserFactory.createEmailUser(
      name,
      normalizedEmail,
      passwordHash,
      rawToken,
      expiry
    );

    await this.userRepository.create(newUser);
    this.eventPublisher.publishVerificationEmail(normalizedEmail, name, rawToken);
  }
}
