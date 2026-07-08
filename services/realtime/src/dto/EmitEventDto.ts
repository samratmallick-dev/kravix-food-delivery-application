export interface EmitEventDto {
  event: string;
  room: string;
  payload?: any;
}

export interface JoinRoomDto {
  room: string;
}
