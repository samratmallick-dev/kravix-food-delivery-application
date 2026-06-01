export interface VerificationEmailPayload {
  type: "VERIFICATION";
  to: string;
  name: string;
  token: string;
}

export interface PasswordResetEmailPayload {
  type: "PASSWORD_RESET";
  to: string;
  name: string;
  token: string;
}

export type EmailJobPayload = VerificationEmailPayload | PasswordResetEmailPayload;
