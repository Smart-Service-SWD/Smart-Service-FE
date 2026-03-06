import { useCallback, useEffect, useState } from 'react';
import {
  adminGraphqlService,
  ServiceListItem,
} from '../../../../shared/api/adminGraphqlService';

interface UseServiceListParams {
  category: string;
  categoryId?: string;
}

export const useServiceList = ({ category, categoryId }: UseServiceListParams) => {
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      if (categoryId) {
        const byCategory = await adminGraphqlService.getServiceDefinitionsByCategory(categoryId);
        setServices(byCategory);
      } else {
        const allServices = await adminGraphqlService.getServiceDefinitions();
        const filtered =
          category === 'Tất cả'
            ? allServices
            : allServices.filter(service => service.categoryName === category);
        setServices(filtered);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, categoryId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices(true);
  }, [fetchServices]);

  return {
    services,
    loading,
    refreshing,
    onRefresh,
  };
};
