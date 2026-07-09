export interface IGoogleRegistrationService {
  registerWithGoogle(code: string): Promise<string>;
}
