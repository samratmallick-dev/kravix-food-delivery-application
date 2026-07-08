import { ValidationError } from "../../utils/errors.js";

export class ChatRequest {
  constructor(
    public readonly message: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly restaurantId?: string
  ) {
    if (!message || message.trim().length === 0) {
      throw new ValidationError("Message cannot be empty");
    }
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
  }
}
