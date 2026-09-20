import { supabase } from './supabase';

export async function resizeImage(file: File, max = 800): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error('Resize failed'))), 'image/webp', 0.85)
  );
}

export async function uploadImage(file: File, folder: string, max = 800): Promise<string> {
  const blob = await resizeImage(file, max);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage
    .from('app-uploads')
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from('app-uploads').getPublicUrl(path).data.publicUrl;
}
