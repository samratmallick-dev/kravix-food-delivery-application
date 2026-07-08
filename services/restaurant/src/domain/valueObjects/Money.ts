import { ValidationError } from "../../utils/errors.js";

export class Money {
  constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new ValidationError("Money amount cannot be negative");
    }
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(Math.max(0, this.amount - other.amount));
  }
}
