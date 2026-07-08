import { AiChatDto, AiResponseDto } from "../dto/AiChatDto.js";

export interface IAIService {
  chat(userId: string, role: string, userName: string, token: string, dto: AiChatDto, requestId: string): Promise<AiResponseDto>;
  feedback(messageId: string, message: string, reply: string, role: string, feedback: number, requestId: string): Promise<void>;
}
