export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly image: string,
    public readonly role: string | null,
    public isBlocked: boolean,
    public blockedUntil: Date | null
  ) {}

  toggleBlock(blockedUntil?: Date | null): void {
    this.isBlocked = !this.isBlocked;
    this.blockedUntil = this.isBlocked ? (blockedUntil || null) : null;
  }
}
