export interface ICloudinaryClient {
  uploadImage(imageBuffer: string): Promise<string>;
}
