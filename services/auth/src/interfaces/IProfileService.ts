import { User } from "../domain/entities/User.js";

export interface IProfileService {
  getUserProfile(userId: string): Promise<User>;
  updateUserProfile(userId: string, name?: string, image?: string): Promise<User>;
  addUserRole(userId: string, role: string): Promise<User>;
}
