/**
 * Cloudinary REST API Service for Unsigned Uploads
 * Cloud Name: u8wm4tbq
 * Upload Preset: fmnwmysl
 */

export const CLOUDINARY_CLOUD_NAME = 'u8wm4tbq';
export const CLOUDINARY_UPLOAD_PRESET = 'fmnwmysl';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export interface CloudinaryMediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
  bytes?: number;
  format?: string;
}

/**
 * Uploads a file (File, Blob, or base64 Data URI) to Cloudinary via Unsigned REST API
 */
export async function uploadToCloudinary(
  file: File | Blob | string,
  fileName?: string
): Promise<CloudinaryMediaItem> {
  const formData = new FormData();

  if (typeof file === 'string') {
    // Base64 Data URI or remote URL
    formData.append('file', file);
  } else {
    formData.append('file', file, fileName || (file as File).name || 'upload');
  }

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  console.log('☁️ Enviando mídia para o Cloudinary (preset: fmnwmysl)...');

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Falha no upload para o Cloudinary:', response.status, errorText);
    throw new Error(`Erro ao subir arquivo para o Cloudinary (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const secureUrl: string = data.secure_url || data.url;
  const resourceType: 'image' | 'video' = data.resource_type === 'video' ? 'video' : 'image';

  console.log('✅ Upload no Cloudinary concluído com sucesso:', {
    url: secureUrl,
    type: resourceType,
    format: data.format,
  });

  return {
    url: secureUrl,
    type: resourceType,
    name: fileName || (typeof file !== 'string' ? (file as File).name : undefined),
    bytes: data.bytes,
    format: data.format,
  };
}
