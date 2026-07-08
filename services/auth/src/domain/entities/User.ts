import { ValidationError } from "../../utils/errors.js";

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly email: string,
    public role: string | null,
    public isEmailVerified: boolean,
    public authProviders: string[],
    public image: string,
    public isBlocked: boolean,
    public passwordHash?: string,
    public emailVerificationToken?: string | null,
    public emailVerificationExpiry?: Date | null,
    public passwordResetToken?: string | null,
    public passwordResetExpiry?: Date | null,
    public restaurantId?: string | null
  ) {}

  updateProfile(name?: string, image?: string): void {
    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        throw new ValidationError("Name must be between 2 and 50 characters.");
      }
      this.name = trimmed;
    }
    if (image !== undefined) {
      this.image = image;
    }
  }

  assignRole(role: string): void {
    const allowed = ["customer", "rider", "seller"];
    if (!allowed.includes(role)) {
      throw new ValidationError("Invalid role");
    }
    this.role = role;
  }

  verifyEmail(token: string): void {
    if (!this.emailVerificationToken || this.emailVerificationToken !== token) {
      throw new ValidationError("Verification link is invalid or has expired.");
    }
    if (this.emailVerificationExpiry && new Date() > this.emailVerificationExpiry) {
      throw new ValidationError("Verification link is invalid or has expired.");
    }
    this.isEmailVerified = true;
    this.emailVerificationToken = null;
    this.emailVerificationExpiry = null;
  }

  checkNotBlocked(): void {
    if (this.isBlocked) {
      throw new ValidationError("Your account has been blocked. Please contact support.");
    }
  }
}
