import { cloudinaryBaseUrl, internalKey } from "@/constants";

export const uploadImage = async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${cloudinaryBaseUrl}/images`, {
            method: "POST",
            headers: { "x-internal-key": internalKey },
            body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.data?.url) throw new Error(data.message || "Image upload failed");
      return data.data.url as string;
};