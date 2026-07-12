export interface ILocationValidationService {
  validateCoordinates(latitude: number, longitude: number): Promise<{ isValid: boolean; errorReason?: string; resolvedAddress?: string }>;
}
