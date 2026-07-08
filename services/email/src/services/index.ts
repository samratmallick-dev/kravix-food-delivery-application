import { GmailClient } from "../clients/gmail.client.js";
import { EmailService } from "./email.service.js";

export const gmailClient = new GmailClient();
export const emailService = new EmailService(gmailClient);
