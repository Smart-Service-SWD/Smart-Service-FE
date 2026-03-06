import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import { adminGraphqlService } from '../../../../shared/api/adminGraphqlService';
import * as userService from '../../../../shared/api/userService';
import { BANNERS, SERVICE_CATEGORY_COLORS } from '../../../../pages/common/home/home.constants';
import { FeaturedService, ServiceCategory } from '../../../../pages/common/home/home.types';

const DEFAULT_CATEGORY_ICON = 'construct-outline' as const;

export const useHomeData = () => {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);

  const fetchHomeData = useCallback(async () => {
    try {
      const categories = await userService.getServiceCategories();
      setServiceCategories(
        categories.map((category: any, index: number) => ({
          id: category.id,
          name: category.name,
          icon: DEFAULT_CATEGORY_ICON,
          color: SERVICE_CATEGORY_COLORS[index % SERVICE_CATEGORY_COLORS.length],
        }))
      );

      const services = await adminGraphqlService.getServiceDefinitions();
      setFeaturedServices(
        services.slice(0, 5).map((service: any) => ({
          id: service.id,
          name: service.name,
          category: service.categoryName,
          reviews: service.bookingCount || 0,
          price: `${service.basePrice} VND`,
        }))
      );
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(() => {
      setCurrentBannerIndex(previousIndex => (previousIndex + 1) % BANNERS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchHomeData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, [fetchHomeData]);

  return {
    user,
    logout,
    menuVisible,
    refreshing,
    currentBannerIndex,
    serviceCategories,
    featuredServices,
    setMenuVisible,
    onRefresh,
  };
};
