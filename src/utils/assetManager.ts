/**
 * Utility for managing and generating Supabase Storage CDN URLs for game assets.
 * Valid game folders: 'guess-the-picture' | 'match-the-order' | 'picture-match'
 * Folder hierarchy: games/[gameFolder]/[formattedRegion]/[fileName]
 * Supports all 8 Official North-Eastern States of India.
 */

export type GameFolder = 'guess-the-picture' | 'match-the-order' | 'picture-match';

export const REGION_ASSETS: Record<string, string[]> = {
  'arunachal-pradesh': [
    'arunachal-tawang.jpg',
    'arunachal-hornbill.jpg',
    'arunachal-sela-pass.jpg',
    'arunachal-ziro-valley.jpg',
  ],
  'arunachal': [
    'arunachal-tawang.jpg',
    'arunachal-hornbill.jpg',
    'arunachal-sela-pass.jpg',
    'arunachal-ziro-valley.jpg',
  ],
  'assam': [
    'assam-bihu-dhol.jpg',
    'assam-kamakhya.jpg',
    'assam-majuli.jpg',
    'assam-muga-silk.jpg',
    'assam-rhino.jpg',
    'assam-tea.jpg',
  ],
  'manipur': [
    'manipur-loktak.jpg',
    'manipur-sangai.jpg',
    'manipur-kangla.jpg',
    'manipur-raas-leela.jpg',
  ],
  'meghalaya': [
    'meghalaya-root-bridge.jpg',
    'meghalaya-nohkalikai.jpg',
    'meghalaya-dawki.jpg',
    'meghalaya-mawlynnong.jpg',
  ],
  'mizoram': [
    'mizoram-cheraw.jpg',
    'mizoram-reiek.jpg',
    'mizoram-puan.jpg',
    'mizoram-vantawng.jpg',
  ],
  'nagaland': [
    'nagaland-hornbill-festival.jpg',
    'nagaland-dzukou.jpg',
    'nagaland-naga-shawl.jpg',
    'nagaland-khonoma.jpg',
  ],
  'sikkim': [
    'sikkim-kanchenjunga.jpg',
    'sikkim-rumtek.jpg',
    'sikkim-red-panda.jpg',
    'sikkim-gurudongmar.jpg',
  ],
  'tripura': [
    'tripura-ujjayanta.jpg',
    'tripura-neermahal.jpg',
    'tripura-unakoti.jpg',
    'tripura-bamboo-craft.jpg',
    'tripura-hojagiri.jpg',
  ],
};

export const normalizeRegionId = (region?: string | null): string => {
  if (!region) return 'assam';
  let formatted = String(region)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

  if (formatted === 'arunachal' || formatted === 'arunachal-pradesh') {
    return 'arunachal-pradesh';
  }

  return REGION_ASSETS[formatted] ? formatted : 'assam';
};

export const getGameAssetUrl = (
  gameFolder: GameFolder,
  region: string,
  fileName: string
): string => {
  const baseUrl = (
    import.meta.env.VITE_SUPABASE_URL || 'https://xbwivmotxmoopjgbkell.supabase.co'
  ).replace(/\/+$/, '');

  const formattedRegion = normalizeRegionId(region);
  const cleanFileName = fileName.trim().replace(/^\/+/, '');

  return `${baseUrl}/storage/v1/object/public/media/games/${gameFolder}/${formattedRegion}/${cleanFileName}`;
};

export const getFallbackGameAssetUrl = (
  gameFolder: GameFolder = 'picture-match'
): string => {
  const baseUrl = (
    import.meta.env.VITE_SUPABASE_URL || 'https://xbwivmotxmoopjgbkell.supabase.co'
  ).replace(/\/+$/, '');
  return `${baseUrl}/storage/v1/object/public/media/games/${gameFolder}/assam/assam-rhino.jpg`;
};

