import { WalletAggregate } from "../domain/aggregates/WalletAggregate.js";

export class WalletMapper {
  static toDomain(raw: any): WalletAggregate {
    return new WalletAggregate(
      raw._id.toString(),
      raw.riderId,
      raw.balance ?? 0,
      raw.pendingSettlement ?? 0,
      raw.codCollection ?? 0,
      raw.tipsEarned ?? 0,
      raw.referralEarnings ?? 0,
      raw.bonuses ?? 0,
      raw.bankName,
      raw.bankAccountNumber,
      raw.bankIfsc,
      raw.upiId,
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPersistence(domain: WalletAggregate): any {
    return {
      riderId: domain.riderId,
      balance: domain.balance,
      pendingSettlement: domain.pendingSettlement,
      codCollection: domain.codCollection,
      tipsEarned: domain.tipsEarned,
      referralEarnings: domain.referralEarnings,
      bonuses: domain.bonuses,
      bankName: domain.bankName,
      bankAccountNumber: domain.bankAccountNumber,
      bankIfsc: domain.bankIfsc,
      upiId: domain.upiId
    };
  }

  static toDto(domain: WalletAggregate): any {
    return {
      id: domain.id,
      riderId: domain.riderId,
      balance: domain.balance,
      pendingSettlement: domain.pendingSettlement,
      codCollection: domain.codCollection,
      tipsEarned: domain.tipsEarned,
      referralEarnings: domain.referralEarnings,
      bonuses: domain.bonuses,
      bankDetails: domain.bankName ? {
        bankName: domain.bankName,
        bankAccountNumber: "****" + (domain.bankAccountNumber || "").slice(-4),
        bankIfsc: domain.bankIfsc
      } : null,
      upiId: domain.upiId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
