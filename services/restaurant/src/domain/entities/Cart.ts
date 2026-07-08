export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly itemId: string,
    public readonly restaurantId: string,
    public quantity: number
  ) {}
}
