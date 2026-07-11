import { ValidationError } from "../../utils/errors.js";

export class WalletAggregate {
  constructor(
    public readonly id: string,
    public readonly riderId: string,
    public balance: number,
    public pendingSettlement: number,
    public codCollection: number,
    public tipsEarned: number,
    public referralEarnings: number,
    public bonuses: number,
    public bankName?: string,
    public bankAccountNumber?: string,
    public bankIfsc?: string,
    public upiId?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  configureBank(bankName: string, bankAccountNumber: string, bankIfsc: string): void {
    if (!bankName || bankName.trim().length === 0) throw new ValidationError("Bank name is required");
    if (!bankAccountNumber || bankAccountNumber.trim().length === 0) throw new ValidationError("Bank account number is required");
    if (!bankIfsc || bankIfsc.trim().length === 0) throw new ValidationError("IFSC code is required");
    this.bankName = bankName;
    this.bankAccountNumber = bankAccountNumber;
    this.bankIfsc = bankIfsc;
  }

  configureUpi(upiId: string): void {
    if (!upiId || !upiId.includes("@")) throw new ValidationError("Invalid UPI ID");
    this.upiId = upiId;
  }

  creditAmount(amount: number, category: "earning" | "bonus" | "referral" | "tip" | "adjustment"): void {
    if (amount <= 0) throw new ValidationError("Credit amount must be greater than zero");
    
    this.balance += amount;
    if (category === "bonus") {
      this.bonuses += amount;
    } else if (category === "referral") {
      this.referralEarnings += amount;
    } else if (category === "tip") {
      this.tipsEarned += amount;
    }
  }

  debitAmount(amount: number, category: "penalty" | "withdrawal" | "adjustment"): void {
    if (amount <= 0) throw new ValidationError("Debit amount must be greater than zero");
    if (this.balance < amount) throw new ValidationError("Insufficient balance");
    
    this.balance -= amount;
    if (category === "withdrawal") {
      this.pendingSettlement += amount;
    }
  }

  confirmSettlement(amount: number): void {
    if (this.pendingSettlement < amount) throw new ValidationError("Settlement amount mismatch");
    this.pendingSettlement -= amount;
  }

  recordCodCollection(amount: number): void {
    if (amount <= 0) throw new ValidationError("COD amount must be positive");
    this.codCollection += amount;
  }

  clearCodCollection(amount: number): void {
    this.codCollection = Math.max(0, this.codCollection - amount);
  }
}
