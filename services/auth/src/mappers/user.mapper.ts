import { User } from "../domain/entities/User.js";

export class UserMapper {
  static toDomain(raw: any): User {
    return new User(
      raw._id.toString(),
      raw.name,
      raw.email,
      raw.role ?? null,
      raw.isEmailVerified,
      raw.authProviders,
      raw.image ?? "",
      raw.isBlocked ?? false,
      raw.passwordHash,
      raw.emailVerificationToken,
      raw.emailVerificationExpiry,
      raw.passwordResetToken,
      raw.passwordResetExpiry,
      raw.restaurantId?.toString() ?? null
    );
  }

  static toPersistence(domain: User): any {
    return {
      name: domain.name,
      email: domain.email,
      role: domain.role,
      isEmailVerified: domain.isEmailVerified,
      authProviders: domain.authProviders,
      image: domain.image,
      isBlocked: domain.isBlocked,
      passwordHash: domain.passwordHash,
      emailVerificationToken: domain.emailVerificationToken,
      emailVerificationExpiry: domain.emailVerificationExpiry,
      passwordResetToken: domain.passwordResetToken,
      passwordResetExpiry: domain.passwordResetExpiry,
      restaurantId: domain.restaurantId
    };
  }
}
