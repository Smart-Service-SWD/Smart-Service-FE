import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ServiceListItem } from '../../../shared/api/adminGraphqlService';

export type ServiceListStackParamList = {
  ServiceList: { category: string; categoryId?: string };
  ServiceDetail: { service: ServiceListItem };
};

export type ServiceListScreenNavigationProp = NativeStackNavigationProp<
  ServiceListStackParamList,
  'ServiceList'
>;

export type ServiceListScreenRouteProp = RouteProp<ServiceListStackParamList, 'ServiceList'>;

export interface ServiceListScreenProps {
  navigation: ServiceListScreenNavigationProp;
  route: ServiceListScreenRouteProp;
}
