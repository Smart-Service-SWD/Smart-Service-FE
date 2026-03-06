import { Banner } from './home.types';

export const BANNERS: Banner[] = [
  {
    id: 1,
    title: 'Professional Home Services',
    subtitle: 'Trusted Experts',
    description: 'Book in seconds',
    color: '#4F46E5',
    icon: 'home-outline',
  },
  {
    id: 2,
    title: '20% Off First Service',
    subtitle: 'New Customer',
    description: 'Limited time offer',
    color: '#EC4899',
    icon: 'gift-outline',
  },
  {
    id: 3,
    title: '24/7 Support Available',
    subtitle: 'Always Here',
    description: 'Fast response time',
    color: '#10B981',
    icon: 'headset-outline',
  },
];

export const SERVICE_CATEGORY_COLORS = [
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
];

export const FEATURED_SERVICE_COLORS: Record<string, string> = {
  Electronics: '#06B6D4',
  Electrical: '#EF4444',
  Legal: '#8B5CF6',
  'Real Estate': '#10B981',
};

