export interface SendEmailDto {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailVerificationDto {
  to: string;
  name: string;
  token: string;
}

export interface PasswordResetDto {
  to: string;
  name: string;
  token: string;
}
