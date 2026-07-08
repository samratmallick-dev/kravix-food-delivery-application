import { ValidationError } from "../../utils/errors.js";

export class SocketEvent {
  constructor(
    public readonly event: string,
    public readonly room: string,
    public readonly payload: any
  ) {
    if (!event || event.trim().length === 0) {
      throw new ValidationError("Event name is required");
    }
    if (!room || room.trim().length === 0) {
      throw new ValidationError("Room name is required");
    }
  }
}
