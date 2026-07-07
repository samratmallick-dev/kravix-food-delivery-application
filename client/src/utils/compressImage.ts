export const compressImage = (file: File, maxSizeKB = 400): Promise<File> =>
    new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const MAX_DIM = 800;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
                else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
            let quality = 0.8;
            const tryCompress = () => {
                canvas.toBlob((blob) => {
                    if (!blob) return resolve(file);
                    if (blob.size / 1024 > maxSizeKB && quality > 0.2) {
                        quality -= 0.1;
                        tryCompress();
                    } else {
                        resolve(new File([blob], file.name, { type: "image/jpeg" }));
                    }
                }, "image/jpeg", quality);
            };
            tryCompress();
        };
        img.src = url;
    });
