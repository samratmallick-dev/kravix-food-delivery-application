export class MenuItem {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly imageUrl: string,
    public readonly isAvailable: boolean
  ) {}
}
