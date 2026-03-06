import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export interface FeaturedService {
  id: string;
  name: string;
  category: string;
  reviews: number;
  price: string;
  discount?: string;
}

type RootStackParamList = {
  HomeMain: undefined;
  ServiceList: { category: string; categoryId?: string };
  ServiceDetail: { service: FeaturedService };
  Profile: undefined;
  CreateRequest: { service: FeaturedService };
  GraphQLDemo: undefined;
  NewRequest: undefined;
  MyRequests: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HomeMain'
>;

export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

