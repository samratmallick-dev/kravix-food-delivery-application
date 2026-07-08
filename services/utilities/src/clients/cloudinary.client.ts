import { v2 as cloudinary } from "cloudinary";
import { ICloudinaryClient } from "../interfaces/ICloudinaryClient.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";
import { ValidationError } from "../utils/errors.js";

export class CloudinaryClient implements ICloudinaryClient {
  private readonly breaker: CircuitBreaker;

  constructor() {
    const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;
    if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
      throw new ValidationError("Missing Cloudinary configurations");
    }
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: CLOUD_API_KEY,
      api_secret: CLOUD_API_SECRET
    });
    this.breaker = new CircuitBreaker("CloudinaryAPI");
  }

  async uploadImage(imageBuffer: string): Promise<string> {
    return this.breaker.execute(async () => {
      const uploadResult = await cloudinary.uploader.upload(imageBuffer, { folder: "uploads" });
      if (!uploadResult.secure_url) {
        throw new ValidationError("Cloudinary upload failed");
      }
      return uploadResult.secure_url;
    });
  }
}
