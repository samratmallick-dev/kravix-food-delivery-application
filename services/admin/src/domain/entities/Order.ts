export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly restaurantName: string,
    public status: string,
    public paymentMethod: string,
    public paymentStatus: string,
    public readonly totalAmount: number
  ) {}

  cancel(): void {
    this.status = "cancelled";
  }
}
