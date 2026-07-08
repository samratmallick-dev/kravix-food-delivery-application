export class Address {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly formatedAddress: string,
    public readonly mobile: number,
    public readonly customerName: string,
    public readonly coordinates: [number, number]
  ) {}
}
