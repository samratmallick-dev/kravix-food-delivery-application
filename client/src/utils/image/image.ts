export const compressImageToFile = (file: File, maxSizeKB = 400): Promise<File> =>
      new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                  URL.revokeObjectURL(url);
                  const MAX_DIM = 800;
                  let { width, height } = img;
                  if (width > MAX_DIM || height > MAX_DIM) {
                        if (width > height) {
                              height = Math.round((height * MAX_DIM) / width);
                              width = MAX_DIM;
                        } else {
                              width = Math.round((width * MAX_DIM) / height);
                              height = MAX_DIM;
                        }
                  }
                  const canvas = document.createElement("canvas");
                  canvas.width = width;
                  canvas.height = height;
                  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
                  let quality = 0.8;
                  const tryCompress = () => {
                        canvas.toBlob(
                              (blob) => {
                                    if (!blob) return resolve(file);
                                    if (blob.size / 1024 > maxSizeKB && quality > 0.2) {
                                          quality -= 0.1;
                                          tryCompress();
                                    } else {
                                          resolve(new File([blob], file.name, { type: "image/jpeg" }));
                                    }
                              },
                              "image/jpeg",
                              quality
                        );
                  };
                  tryCompress();
            };
            img.src = url;
      });

export const compressImageToBase64 = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
      return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                  const img = new Image();
                  img.src = event.target?.result as string;
                  img.onload = () => {
                        const canvas = document.createElement("canvas");
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth) {
                              height = Math.round((height * maxWidth) / width);
                              width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext("2d");

                        if (!ctx) {
                              reject(new Error("Failed to get canvas context"));
                              return;
                        }

                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedBase64 = canvas.toDataURL("image/webp", quality);
                        resolve(compressedBase64);
                  };
                  img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
      });
};