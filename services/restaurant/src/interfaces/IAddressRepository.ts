import { Address } from "../domain/entities/Address.js";

export interface IAddressRepository {
  find(userId: string): Promise<Address[]>;
  findByIdAndUser(id: string, userId: string): Promise<Address | null>;
  create(address: Address): Promise<Address>;
  delete(id: string, userId: string): Promise<void>;
}
