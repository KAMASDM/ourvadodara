// =============================================
// src/components/Admin/mediaContentConfig.js
// Shared metadata for admin media management/editing
// =============================================
import { Clock, Film, Layers } from 'lucide-react';
import { MEDIA_DATABASE_PATHS } from '../../utils/mediaSchema';

export const MEDIA_TYPE_CONFIG = {
  story: {
    label: 'Story',
    icon: Clock,
    path: MEDIA_DATABASE_PATHS.STORIES,
    accent: 'bg-purple-50 text-purple-700 border border-purple-200'
  },
  reel: {
    label: 'Reel',
    icon: Film,
    path: MEDIA_DATABASE_PATHS.REELS,
    accent: 'bg-pink-50 text-pink-700 border border-pink-200'
  },
  carousel: {
    label: 'Carousel',
    icon: Layers,
    path: MEDIA_DATABASE_PATHS.CAROUSELS,
    accent: 'bg-blue-50 text-blue-700 border border-blue-200'
  }
};
