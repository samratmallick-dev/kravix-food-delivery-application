import { IAddressService } from "../interfaces/IAddressService.js";
import { IAddressRepository } from "../interfaces/IAddressRepository.js";
import { Address } from "../domain/entities/Address.js";
import { AddressRequestDto } from "../dto/restaurant.dto.js";

export class AddressService implements IAddressService {
  constructor(private addressRepository: IAddressRepository) {}

  async getMyAddresses(userId: string): Promise<Address[]> {
    return await this.addressRepository.find(userId);
  }

  async addAddress(userId: string, dto: AddressRequestDto): Promise<Address> {
    const address = new Address(
      "",
      userId,
      dto.formattedAddress,
      dto.mobile,
      "",
      [dto.longitude, dto.latitude]
    );
    return await this.addressRepository.create(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    await this.addressRepository.delete(addressId, userId);
  }
}
