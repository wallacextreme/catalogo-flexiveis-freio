/**
 * CLIENT-SIDE WEBP IMAGE PIPELINE
 * Converts user photos, Drag & Drop files, and Clipboard Paste (Ctrl+V / Win+Shift+S)
 * to compressed high-fidelity WebP (quality 0.92) directly in the browser via HTML5 Canvas.
 */

export interface ConvertedWebPResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  width: number;
  height: number;
}

export async function convertBlobToWebP(
  fileOrBlob: Blob,
  quality: number = 0.92,
  maxDimension: number = 1920
): Promise<ConvertedWebPResult> {
  const originalSize = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Downscale proportionally if exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Falha ao obter contexto 2D do Canvas'));
          return;
        }

        // Composite over pure studio white (#FFFFFF)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        const dataUrl = canvas.toDataURL('image/webp', quality);
        // Estimate size from base64
        const head = 'data:image/webp;base64,';
        const base64Str = dataUrl.startsWith(head) ? dataUrl.slice(head.length) : dataUrl;
        const compressedSize = Math.round((base64Str.length * 3) / 4);
        const savedPercentage = originalSize > compressedSize
          ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
          : 0;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          savedPercentage,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('Erro ao decodificar imagem'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem'));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Extracts image blobs from clipboard paste event (e.g. Win+Shift+S / Ctrl+V).
 */
export function extractImagesFromClipboard(event: ClipboardEvent): Blob[] {
  const items = event.clipboardData?.items;
  if (!items) return [];

  const blobs: Blob[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) blobs.push(file);
    }
  }
  return blobs;
}

/**
 * Formats bytes to human-readable string (e.g. "1.2 MB" or "145 KB").
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
