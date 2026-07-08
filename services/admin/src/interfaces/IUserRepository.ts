import { User } from "../domain/entities/User.js";

export interface IUserRepository {
  find(filter: Record<string, any>, skip: number, limit: number): Promise<User[]>;
  count(filter: Record<string, any>): Promise<number>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  countByRole(): Promise<any>;
}
