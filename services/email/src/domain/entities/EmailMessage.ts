import { ValidationError } from "../../utils/errors.js";

export class EmailMessage {
  constructor(
    public readonly to: string,
    public readonly subject: string,
    public readonly html: string,
    public readonly text: string
  ) {
    if (!to || !to.includes("@")) {
      throw new ValidationError("Invalid recipient email address");
    }
    if (!subject || subject.trim().length === 0) {
      throw new ValidationError("Subject is required");
    }
  }
}
