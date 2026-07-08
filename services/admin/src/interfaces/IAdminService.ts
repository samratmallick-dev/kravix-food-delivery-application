export interface IAdminService {
  login(email?: string, password?: string): Promise<string>;
}
