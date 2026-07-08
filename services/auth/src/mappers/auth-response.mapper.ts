import { User } from "../domain/entities/User.js";
import { UserResponseDto } from "../dto/auth.dto.js";

export class AuthResponseMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      authProviders: user.authProviders,
      image: user.image,
      restaurantId: user.restaurantId ?? null
    };
  }
}
