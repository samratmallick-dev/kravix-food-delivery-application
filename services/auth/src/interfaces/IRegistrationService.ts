export interface IRegistrationService {
  register(name: string, email: string, password: string): Promise<void>;
}
