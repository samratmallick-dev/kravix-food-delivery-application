import { UserRepository } from "../repositories/user.repository.js";
import { AuthEventPublisher } from "../events/AuthEvents.js";
import { GoogleClient } from "../clients/GoogleClient.js";
import { JwtService } from "./jwt.service.js";
import { RegistrationService } from "./RegistrationService.js";
import { GoogleRegistrationService } from "./GoogleRegistrationService.js";
import { EmailLoginService } from "./EmailLoginService.js";
import { GoogleLoginService } from "./GoogleLoginService.js";
import { PasswordResetService } from "./PasswordResetService.js";
import { VerificationService } from "./VerificationService.js";
import { ProfileService } from "./ProfileService.js";

export const userRepository = new UserRepository();
export const eventPublisher = new AuthEventPublisher();
export const googleClient = new GoogleClient();
export const jwtService = new JwtService();

export const registrationService = new RegistrationService(userRepository, eventPublisher);
export const googleRegistrationService = new GoogleRegistrationService(userRepository, googleClient, eventPublisher);
export const emailLoginService = new EmailLoginService(userRepository);
export const googleLoginService = new GoogleLoginService(userRepository, googleClient);
export const passwordResetService = new PasswordResetService(userRepository, eventPublisher);
export const verificationService = new VerificationService(userRepository, eventPublisher);
export const profileService = new ProfileService(userRepository, eventPublisher);
