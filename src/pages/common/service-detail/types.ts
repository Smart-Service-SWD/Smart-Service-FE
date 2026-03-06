import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface Service {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
  rating: number;
  reviews: number;
  price: string;
  basePrice?: number;
  description: string;
  bookingCount?: number;
}

export type ServiceDetailStackParamList = {
  ServiceDetail: { service: Service };
  Profile: undefined;
  CreateRequest: { service: Service };
};

export type ServiceDetailNavigationProp = NativeStackNavigationProp<
  ServiceDetailStackParamList,
  'ServiceDetail'
>;

export type ServiceDetailRouteProp = RouteProp<
  ServiceDetailStackParamList,
  'ServiceDetail'
>;

export interface ServiceDetailScreenProps {
  navigation: ServiceDetailNavigationProp;
  route: ServiceDetailRouteProp;
}
