import { EmitEventDto } from "../dto/EmitEventDto.js";

export interface ISocketService {
  emitEvent(dto: EmitEventDto): void;
}
