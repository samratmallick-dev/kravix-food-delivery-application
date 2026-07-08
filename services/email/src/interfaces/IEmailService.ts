import { EmailVerificationDto, PasswordResetDto } from "../dto/SendEmailDto.js";

export interface IEmailService {
  sendVerificationEmail(dto: EmailVerificationDto): Promise<void>;
  sendPasswordResetEmail(dto: PasswordResetDto): Promise<void>;
}
