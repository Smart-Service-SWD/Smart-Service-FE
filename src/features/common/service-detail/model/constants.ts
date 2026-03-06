import { Ionicons } from '@expo/vector-icons';

export const getCategoryTheme = (categoryName: string) => {
  const themes: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    Electronics: { color: '#06B6D4', icon: 'hardware-chip-outline' },
    Electrical: { color: '#EF4444', icon: 'flash-outline' },
    Legal: { color: '#8B5CF6', icon: 'document-text-outline' },
    'Real Estate': { color: '#10B981', icon: 'home-outline' },
  };
  return themes[categoryName] || { color: '#0066CC', icon: 'construct-outline' };
};
