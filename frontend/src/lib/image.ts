
/**
 * Compresses an image file if it exceeds a certain size.
 * Uses HTMLCanvasElement to resize/compress.
 */
export async function compressImage(file: File, quality = 0.7, maxWidth = 1200): Promise<File> {
  // If not an image, return original
  if (!file.type.startsWith('image/')) return file;
  
  // If small enough (e.g. < 500KB), return original
  if (file.size < 500 * 1024) return file;

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

        // Maintain aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Check if compressed is actually smaller
            if (blob.size < file.size) {
               const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => resolve(file); // Fail safe
    };
    reader.onerror = (err) => resolve(file); // Fail safe
  });
}
