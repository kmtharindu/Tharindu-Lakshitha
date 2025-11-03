
import { ImageData } from '../types';

export const fileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const url = reader.result as string;
      const base64 = url.split(',')[1];
      resolve({
        base64,
        mimeType: file.type,
        url,
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const addWatermark = (imageUrl: string, text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Make font size responsive to image size, but not too small or large.
      const fontSize = Math.max(12, Math.min(img.width * 0.02, img.height * 0.03));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Subtle white
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      // Add a subtle shadow for better readability on any background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      const padding = fontSize * 1.2; // Padding from the edge
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (error) => reject(error);
    img.src = imageUrl;
  });
};
