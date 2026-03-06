import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import { getCategoryTheme } from './constants';

interface ServiceForDetail {
  category: string;
  categoryName?: string;
}

interface UseServiceDetailParams {
  navigation: any;
  service: ServiceForDetail;
}

export const useServiceDetail = ({ navigation, service }: UseServiceDetailParams) => {
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  const theme = useMemo(
    () => getCategoryTheme(service.categoryName || service.category),
    [service.category, service.categoryName]
  );

  const handleBookService = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to book this service',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }

    navigation.navigate('CreateRequest', { service });
  };

  return {
    theme,
    handleBookService,
  };
};
