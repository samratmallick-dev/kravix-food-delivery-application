import { SocketEvent } from "../domain/entities/SocketEvent.js";
import { EmitEventDto } from "../dto/EmitEventDto.js";

export class SocketEventMapper {
  static toDto(domain: SocketEvent): EmitEventDto {
    return {
      event: domain.event,
      room: domain.room,
      payload: domain.payload
    };
  }
}
