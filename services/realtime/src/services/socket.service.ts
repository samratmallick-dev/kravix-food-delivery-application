import { ISocketService } from "../interfaces/ISocketService.js";
import { EmitEventDto } from "../dto/EmitEventDto.js";
import { SocketEventFactory } from "../factories/SocketEventFactory.js";
import { getIO } from "../config/socket.js";

export class SocketService implements ISocketService {
  emitEvent(dto: EmitEventDto): void {
    const socketEvent = SocketEventFactory.create(dto);
    const io = getIO();
    io.to(socketEvent.room).emit(socketEvent.event, socketEvent.payload);
  }
}
