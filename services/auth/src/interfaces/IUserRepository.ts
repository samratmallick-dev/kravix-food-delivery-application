import { User } from "../domain/entities/User.js";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
  findByResetToken(token: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
