export class MetricsPoint {
  constructor(
    public readonly label: string,
    public readonly value: number,
    public readonly details?: any
  ) {}
}
