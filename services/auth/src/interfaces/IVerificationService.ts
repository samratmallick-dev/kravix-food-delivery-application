export interface IVerificationService {
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
}
