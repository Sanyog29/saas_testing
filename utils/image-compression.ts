/**
 * Utility for frontend image compression before upload to Supabase Storage.
 * Resizes to max 1280px, converts to WebP, and aims for < 500KB.
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<File> => {
    const {
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.8,
        format = 'image/webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio and resize
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }

                        // Create new file from compressed blob
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newFileName, {
                            type: format,
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    format,
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
