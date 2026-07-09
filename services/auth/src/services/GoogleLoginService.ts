import { IGoogleLoginService } from "../interfaces/IGoogleLoginService.js";
import { IUserRepository } from "../interfaces/IUserRepository.js";
import { IGoogleClient } from "../interfaces/IGoogleClient.js";
import { User } from "../domain/entities/User.js";
import { AuthenticationError } from "../utils/errors.js";

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

    let needsUpdate = false;

    if (!user.authProviders.includes("google")) {
      user.authProviders.push("google");
      needsUpdate = true;
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await this.userRepository.update(user);
    }

    user.checkNotBlocked();

    return user;
  }
}
