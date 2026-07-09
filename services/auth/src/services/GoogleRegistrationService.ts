import crypto from "crypto";
import { IGoogleRegistrationService } from "../interfaces/IGoogleRegistrationService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IGoogleClient } from "../interfaces/IGoogleClient.js";
import { IAuthEventPublisher } from "../interfaces/IAuthEventPublisher.js";
import { ConflictError } from "../utils/errors.js";
import { UserFactory } from "../factories/user.factory.js";

export class GoogleRegistrationService implements IGoogleRegistrationService {
  constructor(
    private userRepository: IUserRepository,
    private googleClient: IGoogleClient,
    private eventPublisher: IAuthEventPublisher
  ) {}

  async registerWithGoogle(code: string): Promise<string> {
    const profile = await this.googleClient.exchangeCode(code);
    const existing = await this.userRepository.findByEmail(profile.email);

    if (existing) {
      if (existing.authProviders.includes("email") && !existing.authProviders.includes("google")) {
        existing.authProviders.push("google");
        if (!existing.image && profile.picture) {
          existing.image = profile.picture;
        }
        await this.userRepository.update(existing);
        this.eventPublisher.publishUserRegistered(existing.id, existing.name, existing.email, existing.image);
        return existing.email;
      }
      throw new ConflictError("This email is already registered. Please sign in instead.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = UserFactory.createGoogleUser(
      profile.name,
      profile.email,
      profile.picture
    );
    newUser.isEmailVerified = false;
    newUser.emailVerificationToken = rawToken;
    newUser.emailVerificationExpiry = expiry;

    const saved = await this.userRepository.create(newUser);

    this.eventPublisher.publishVerificationEmail(profile.email, profile.name, rawToken);
    this.eventPublisher.publishUserRegistered(saved.id, saved.name, saved.email, saved.image);
    return profile.email;
  }
}
