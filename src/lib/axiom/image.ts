const MAX_CHARS = 220_000;
const MAX_EDGE = 720;
const PORTRAIT_EDGE = 800;
const HERO_EDGE = 1200;

export async function fileToDataUrl(file: File): Promise<string> {
  return compressFile(file, MAX_EDGE, "image/jpeg", 0.74);
}

export async function fileToPortraitUrl(file: File): Promise<string> {
  try {
    return await compressFile(file, PORTRAIT_EDGE, "image/webp", 0.82);
  } catch {
    return compressFile(file, PORTRAIT_EDGE, "image/jpeg", 0.74);
  }
}

export async function fileToHeroUrl(file: File): Promise<string> {
  return compressFile(file, HERO_EDGE, "image/jpeg", 0.7);
}

async function compressFile(
  file: File,
  maxEdge: number,
  mime: "image/jpeg" | "image/webp",
  startQuality: number,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read image");
    ctx.drawImage(img, 0, 0, width, height);
    let quality = startQuality;
    let out = canvas.toDataURL(mime, quality);
    if (!out.startsWith(`data:${mime}`)) {
      out = canvas.toDataURL("image/jpeg", quality);
    }
    while (out.length > MAX_CHARS && quality > 0.4) {
      quality -= 0.1;
      out = canvas.toDataURL(out.startsWith("data:image/webp") ? "image/webp" : "image/jpeg", quality);
    }
    if (out.length > MAX_CHARS) {
      throw new Error("Image is still too large after compressing");
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

export function isStoredImage(value: string | null | undefined): value is string {
  return Boolean(value && (value.startsWith("data:image/") || value.startsWith("/")));
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
