export interface IAuthEventPublisher {
  publishUserRoleUpdated(userId: string, name: string, email: string, role: string | null): void;
  publishUserRegistered(userId: string, name: string, email: string, image: string): void;
  publishUserProfileSynced(userId: string, name: string, email: string, image: string): void;
  publishVerificationEmail(email: string, name: string, token: string): void;
  publishPasswordResetEmail(email: string, name: string, token: string): void;
}
