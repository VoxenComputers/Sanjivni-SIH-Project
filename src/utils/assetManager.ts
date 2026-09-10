/**
 * Utility for managing and generating Supabase Storage CDN URLs for game assets.
 * Valid game folders: 'guess-the-picture' | 'match-the-order' | 'picture-match'
 * Folder hierarchy: games/[gameFolder]/[formattedRegion]/[fileName]
 */

export type GameFolder = 'guess-the-picture' | 'match-the-order' | 'picture-match';

export const getGameAssetUrl = (
  gameFolder: 'guess-the-picture' | 'match-the-order' | 'picture-match',
  region: string,
  fileName: string
): string => {
  const baseUrl = (
    import.meta.env.VITE_SUPABASE_URL || 'https://xbwivmotxmoopjgbkell.supabase.co'
  ).replace(/\/+$/, '');

  let formattedRegion = (region || 'assam')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  if (formattedRegion === 'arunachal') {
    formattedRegion = 'arunachal-pradesh';
  }

  const cleanFileName = fileName.trim().replace(/^\/+/, '');

  return `${baseUrl}/storage/v1/object/public/media/games/${gameFolder}/${formattedRegion}/${cleanFileName}`;
};
