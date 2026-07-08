export interface IUserRepository {
  findBlockedOwnerIds(now: Date): Promise<string[]>;
}
