import { Ionicons } from '@expo/vector-icons';

const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  Electronics: 'hardware-chip-outline',
  Electrical: 'flash-outline',
  Legal: 'document-text-outline',
  'Real Estate': 'home-outline',
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Electronics: '#FF6B6B',
  Electrical: '#FFB800',
  Legal: '#0066CC',
  'Real Estate': '#2ECC71',
};

export const getServiceCategoryIcon = (
  categoryName: string
): keyof typeof Ionicons.glyphMap => {
  return CATEGORY_ICON_MAP[categoryName] || 'construct-outline';
};

export const getServiceCategoryColor = (categoryName: string): string => {
  return CATEGORY_COLOR_MAP[categoryName] || '#0066CC';
};
