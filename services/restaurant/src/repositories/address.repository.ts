import { IAddressRepository } from "../interfaces/IAddressRepository.js";
import { Address } from "../domain/entities/Address.js";
import { Address as AddressModel } from "../model/Address.js";
import { AddressMapper } from "../mappers/address.mapper.js";

export class AddressRepository implements IAddressRepository {
  async find(userId: string): Promise<Address[]> {
    const raw = await AddressModel.find({ userId }).lean();
    return raw.map(AddressMapper.toDomain);
  }

  async findByIdAndUser(id: string, userId: string): Promise<Address | null> {
    const raw = await AddressModel.findOne({ _id: id, userId }).lean();
    if (!raw) return null;
    return AddressMapper.toDomain(raw);
  }

  async create(address: Address): Promise<Address> {
    const persistence = AddressMapper.toPersistence(address);
    const raw = await AddressModel.create(persistence);
    return AddressMapper.toDomain(raw);
  }

  async delete(id: string, userId: string): Promise<void> {
    await AddressModel.deleteOne({ _id: id, userId });
  }
}
