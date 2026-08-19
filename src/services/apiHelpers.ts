/**
 * Utility helper with Exponential Backoff & Retry for Google API requests
 * Handles HTTP 429 (Too Many Requests) and HTTP 503 (Service Unavailable)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<Response> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, options);

      // Check if transient error or rate limit
      if (response.status === 429 || response.status === 503 || response.status === 500) {
        if (attempt === maxRetries) {
          return response;
        }
        console.warn(`[Google API Retry] Status ${response.status}. Retrying in ${delay}ms (Attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        attempt++;
        continue;
      }

      return response;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`[Google API Network Error] Retrying in ${delay}ms (Attempt ${attempt + 1}/${maxRetries})...`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      attempt++;
    }
  }

  throw new Error('Google API request failed after maximum retries');
}

/**
 * Image compressor utility to optimize mobile field uploads
 */
export async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    // If not an image or SVG/GIF, return as is
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
