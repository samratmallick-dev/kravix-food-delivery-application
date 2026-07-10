export interface ICache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  clear(): Promise<void>;
  delete(key: string): Promise<void>;
}
