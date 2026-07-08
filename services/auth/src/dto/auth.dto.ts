export interface RegisterRequestDto {
  name: string;
  email: string;
  password?: string;
  code?: string;
}

export interface LoginRequestDto {
  email?: string;
  password?: string;
  code?: string;
}

export interface ProfileUpdateRequestDto {
  name?: string;
  image?: string;
}

export interface UserResponseDto {
  _id: string;
  name: string;
  email: string;
  role: string | null;
  isEmailVerified: boolean;
  authProviders: string[];
  image: string;
  restaurantId: string | null;
}
