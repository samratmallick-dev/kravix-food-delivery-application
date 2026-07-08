import { Address } from "../domain/entities/Address.js";
import { AddressRequestDto } from "../dto/restaurant.dto.js";

export interface IAddressService {
  getMyAddresses(userId: string): Promise<Address[]>;
  addAddress(userId: string, dto: AddressRequestDto): Promise<Address>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
}
