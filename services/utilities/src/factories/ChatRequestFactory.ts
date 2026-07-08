import { ChatRequest } from "../domain/valueObjects/ChatRequest.js";
import { AiChatDto } from "../dto/AiChatDto.js";

export class ChatRequestFactory {
  static create(userId: string, role: string, dto: AiChatDto): ChatRequest {
    return new ChatRequest(
      dto.message,
      userId,
      role,
      dto.restaurantId
    );
  }
}
