import { useCallback, useEffect, useState } from 'react';
import {
  getServiceCategories,
  ServiceCategory,
} from '../../../../shared/api/graphqlService';

export const useGraphqlDemo = () => {
  const [list, setList] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getServiceCategories();
      setList(data);
    } catch (errorResponse) {
      setError(errorResponse instanceof Error ? errorResponse.message : 'Loi goi API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    list,
    loading,
    error,
    fetchCategories,
  };
};
