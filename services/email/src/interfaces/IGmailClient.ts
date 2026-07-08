import { EmailMessage } from "../domain/entities/EmailMessage.js";

export interface IGmailClient {
  send(message: EmailMessage): Promise<void>;
  isEnabled(): boolean;
}
