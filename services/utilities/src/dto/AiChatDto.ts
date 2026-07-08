export interface AiChatDto {
  message: string;
  restaurantId?: string | undefined;
  currentPage?: string | undefined;
  currentModule?: string | undefined;
  preferredLanguage?: string | undefined;
  recentActions?: string[] | undefined;
}

export interface AiResponseDto {
  reply: string;
  intent: string;
  action: string;
  intent_confidence: number;
  entities: any;
  followUp: string[];
}
