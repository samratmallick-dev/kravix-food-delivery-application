export interface ITransactionRepository {
  findByRiderId(riderId: string, limit?: number): Promise<any[]>;
  create(transactionData: any): Promise<any>;
  findSettlementsByRiderId(riderId: string, limit?: number): Promise<any[]>;
  createSettlement(settlementData: any): Promise<any>;
}
