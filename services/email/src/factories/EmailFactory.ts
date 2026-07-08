import { EmailMessage } from "../domain/entities/EmailMessage.js";

export class EmailFactory {
  static create(to: string, subject: string, html: string, text: string): EmailMessage {
    return new EmailMessage(to, subject, html, text);
  }
}
