import { Rider } from "../domain/entities/Rider.js";

export interface IRiderRepository {
  find(filter: Record<string, any>, skip: number, limit: number): Promise<Rider[]>;
  count(filter: Record<string, any>): Promise<number>;
  findById(id: string): Promise<Rider | null>;
  update(rider: Rider): Promise<Rider>;
  countByVerification(): Promise<any>;
  findByUserIds(userIds: string[]): Promise<Rider[]>;
  delete(id: string): Promise<void>;
}
