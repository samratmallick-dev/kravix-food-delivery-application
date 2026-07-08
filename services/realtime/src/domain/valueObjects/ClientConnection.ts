import { ValidationError } from "../../utils/errors.js";

export class ClientConnection {
  constructor(
    public readonly socketId: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly restaurantId?: string
  ) {
    if (!socketId) {
      throw new ValidationError("Socket ID is required");
    }
    if (!userId) {
      throw new ValidationError("User ID is required");
    }
  }
}
