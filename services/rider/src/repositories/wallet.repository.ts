import { IWalletRepository } from "../interfaces/IWalletRepository.js";
import { WalletAggregate } from "../domain/aggregates/WalletAggregate.js";
import { Wallet as WalletModel } from "../model/Wallet.js";
import { WalletMapper } from "../mappers/wallet.mapper.js";

export class WalletRepository implements IWalletRepository {
  async findByRiderId(riderId: string): Promise<WalletAggregate | null> {
    const raw = await WalletModel.findOne({ riderId });
    if (!raw) return null;
    return WalletMapper.toDomain(raw);
  }

  async save(wallet: WalletAggregate): Promise<WalletAggregate> {
    const persistence = WalletMapper.toPersistence(wallet);
    const saved = await WalletModel.findOneAndUpdate(
      { riderId: wallet.riderId },
      persistence,
      { new: true, upsert: true }
    );
    return WalletMapper.toDomain(saved);
  }

  async create(wallet: WalletAggregate): Promise<WalletAggregate> {
    const persistence = WalletMapper.toPersistence(wallet);
    const created = await WalletModel.create(persistence);
    return WalletMapper.toDomain(created);
  }
}
