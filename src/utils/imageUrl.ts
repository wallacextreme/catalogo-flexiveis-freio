/**
 * Helper to resolve static and dynamic image URLs respecting Vite's base path
 * Works in dev (localhost), production, Tauri v2, and GitHub Pages subpaths.
 */
export function resolveImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Keep external, data, or blob URLs intact
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${cleanUrl}`;
}
