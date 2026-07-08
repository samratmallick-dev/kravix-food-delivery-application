import { User } from "../domain/entities/User.js";

export class UserMapper {
  static toDomain(raw: any): User {
    return new User(
      raw._id.toString(),
      raw.name,
      raw.email,
      raw.image,
      raw.role ?? null,
      raw.isBlocked ?? false,
      raw.blockedUntil ? new Date(raw.blockedUntil) : null
    );
  }

  static toPersistence(domain: User): any {
    return {
      name: domain.name,
      email: domain.email,
      image: domain.image,
      role: domain.role,
      isBlocked: domain.isBlocked,
      blockedUntil: domain.blockedUntil
    };
  }
}
