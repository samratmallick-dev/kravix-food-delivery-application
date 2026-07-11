import { ITransactionRepository } from "../interfaces/ITransactionRepository.js";
import { Transaction as TransactionModel } from "../model/Transaction.js";
import { Settlement as SettlementModel } from "../model/Settlement.js";

export class TransactionRepository implements ITransactionRepository {
  async findByRiderId(riderId: string, limit: number = 50): Promise<any[]> {
    return TransactionModel.find({ riderId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async create(transactionData: any): Promise<any> {
    return TransactionModel.create(transactionData);
  }

  async findSettlementsByRiderId(riderId: string, limit: number = 50): Promise<any[]> {
    return SettlementModel.find({ riderId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async createSettlement(settlementData: any): Promise<any> {
    return SettlementModel.create(settlementData);
  }
}
