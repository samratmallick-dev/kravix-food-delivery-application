import { WalletAggregate } from "../domain/aggregates/WalletAggregate.js";

export interface IWalletRepository {
  findByRiderId(riderId: string): Promise<WalletAggregate | null>;
  save(wallet: WalletAggregate): Promise<WalletAggregate>;
  create(wallet: WalletAggregate): Promise<WalletAggregate>;
}
