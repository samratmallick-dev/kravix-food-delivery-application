import { IGoogleLoginService } from "../interfaces/IGoogleLoginService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IGoogleClient } from "../interfaces/IGoogleClient.js";
import { User } from "../domain/entities/User.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";

export class GoogleLoginService implements IGoogleLoginService {
  constructor(
    private userRepository: IUserRepository,
    private googleClient: IGoogleClient
  ) {}

  async loginWithGoogle(code: string): Promise<User> {
    const profile = await this.googleClient.exchangeCode(code);
    const user = await this.userRepository.findByEmail(profile.email);

    if (!user) {
      throw new AuthenticationError("No account exists with this email. Please register first.", "REGISTER_FIRST");
    }

    if (!user.authProviders.includes("google")) {
      throw new AuthorizationError("This account is not linked with Google Sign-In. Please use Email login.");
    }

    if (!user.isEmailVerified) {
      throw new AuthorizationError("Please verify your email before signing in.", "EMAIL_NOT_VERIFIED");
    }

    user.checkNotBlocked();

    return user;
  }
}
