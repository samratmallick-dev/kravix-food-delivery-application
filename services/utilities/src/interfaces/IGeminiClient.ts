export interface IGeminiClient {
  chat(payload: any, requestId: string): Promise<any>;
  sendFeedback(payload: any, requestId: string): Promise<void>;
  ready(): Promise<any>;
}
