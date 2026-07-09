export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly restaurantName: string,
    public status: string,
    public paymentMethod: string,
    public paymentStatus: string,
    public readonly totalAmount: number,
    public readonly createdAt?: Date,
    public readonly deliveryAddress?: {
      formatedAddress: string;
      mobile: number;
      customerName: string;
      latitude: number;
      longitude: number;
    },
    public readonly items?: any[],
    public readonly subtotal?: number,
    public readonly deliveryFee?: number,
    public readonly platformFee?: number,
    public readonly riderName?: string | null
  ) {}

  cancel(): void {
    this.status = "cancelled";
  }
}
