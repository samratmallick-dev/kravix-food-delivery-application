import { v2 as cloudinary } from "cloudinary";

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

if (
      [CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET].some(
            (e) => !e || e.trim() === "",
      )
) {
      throw new Error("Missing Cloudinary keys...");
}

cloudinary.config({
      cloud_name: CLOUD_NAME as string,
      api_key: CLOUD_API_KEY as string,
      api_secret: CLOUD_API_SECRET as string,
});

export default cloudinary;
