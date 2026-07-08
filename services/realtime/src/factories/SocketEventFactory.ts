import { SocketEvent } from "../domain/entities/SocketEvent.js";
import { EmitEventDto } from "../dto/EmitEventDto.js";

export class SocketEventFactory {
  static create(dto: EmitEventDto): SocketEvent {
    return new SocketEvent(
      dto.event,
      dto.room,
      dto.payload ?? {}
    );
  }
}
