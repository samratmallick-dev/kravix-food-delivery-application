import { User } from "../domain/entities/User.js";

export interface IUserModerationService {
  getAllUsers(page: number, limit: number, role?: string): Promise<{ users: User[]; total: number }>;
  getUserById(id: string): Promise<User>;
  blockUser(userId: string): Promise<User>;
}
