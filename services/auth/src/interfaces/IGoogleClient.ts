export interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export interface IGoogleClient {
  exchangeCode(code: string): Promise<GoogleProfile>;
}
